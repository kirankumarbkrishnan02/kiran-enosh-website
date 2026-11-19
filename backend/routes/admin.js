const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendHelpdeskNotification, sendHelpdeskConfirmation, sendTicketReply } = require('../utils/mailer');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ============ ADMIN GUARD ============ */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/* ============ ADMIN STATS ============ */
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const usersRes = await pool.query('SELECT COUNT(*) FROM users');
    const enrollRes = await pool.query('SELECT COUNT(*) FROM enrollments');
    let coursesCount = 0;
    try {
      const coursesRes = await pool.query('SELECT COUNT(*) FROM courses');
      coursesCount = parseInt(coursesRes.rows[0].count);
    } catch (e) {
      coursesCount = 0;
    }
    res.json({
      users: parseInt(usersRes.rows[0].count),
      courses: coursesCount,
      enrollments: parseInt(enrollRes.rows[0].count),
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

/* ============ GET ALL USERS ============ */
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, created_at, last_login
       FROM users
       ORDER BY created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Users error:', err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

/* ============ UPDATE USER ROLE ============ */
router.patch('/users/:id/role', auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['student', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: "You can't change your own role" });
  }
  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

/* ============ DELETE USER ============ */
router.delete('/users/:id', auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: "You can't delete your own account" });
  }
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/* ============================================================
   COURSES
   ============================================================ */

router.get('/courses', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM courses WHERE is_active = true ORDER BY id'
    );
    res.json({ courses: result.rows });
  } catch (err) {
    console.error('Courses error:', err);
    res.status(500).json({ error: 'Failed to load courses' });
  }
});

router.post('/enroll', auth, async (req, res) => {
  const { course_name } = req.body;
  if (!course_name) return res.status(400).json({ error: 'Course name required' });
  try {
    const existing = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_name = $2',
      [req.user.id, course_name]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Already enrolled in this course' });
    }
    await pool.query(
      'INSERT INTO enrollments (user_id, course_name) VALUES ($1, $2)',
      [req.user.id, course_name]
    );
    res.json({ success: true, message: `Enrolled in ${course_name}` });
  } catch (err) {
    console.error('Enroll error:', err);
    res.status(500).json({ error: 'Failed to enroll' });
  }
});

router.get('/my-courses', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, course_name, enrolled_at FROM enrollments WHERE user_id = $1 ORDER BY enrolled_at DESC',
      [req.user.id]
    );
    res.json({ courses: result.rows });
  } catch (err) {
    console.error('My courses error:', err);
    res.status(500).json({ error: 'Failed to load enrollments' });
  }
});

/* ============================================================
   HELPDESK
   ============================================================ */

router.post('/helpdesk', auth, async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message required' });
  }
  if (message.length < 10) {
    return res.status(400).json({ error: 'Please describe your issue in more detail' });
  }

  try {
    const userRes = await pool.query(
      'SELECT name, email, phone FROM users WHERE id = $1',
      [req.user.id]
    );
    const student = userRes.rows[0];

    const ticketRes = await pool.query(
      `INSERT INTO helpdesk_tickets (user_id, subject, message)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [req.user.id, subject, message]
    );
    const ticketId = ticketRes.rows[0].id;

    try {
      await sendHelpdeskNotification({ student, subject, message, ticketId });
      console.log(`📧 Admin notified of ticket #${ticketId}`);
    } catch (err) {
      console.error('Failed to notify admin:', err.message);
    }

    try {
      await sendHelpdeskConfirmation({ student, subject, ticketId });
      console.log(`📧 Student confirmation sent to ${student.email}`);
    } catch (err) {
      console.error('Failed to send student confirmation:', err.message);
    }

    res.json({
      success: true,
      ticket_id: ticketId,
      message: 'Thank you! Our team will contact you within 24 hours.',
      user: { name: student.name, email: student.email, phone: student.phone },
    });
  } catch (err) {
    console.error('Helpdesk error:', err);
    res.status(500).json({ error: 'Failed to submit ticket' });
  }
});

router.get('/helpdesk/tickets', auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM helpdesk_tickets t
       JOIN users u ON u.id = t.user_id
       ORDER BY t.created_at DESC`
    );
    res.json({ tickets: result.rows });
  } catch (err) {
    console.error('Tickets error:', err);
    res.status(500).json({ error: 'Failed to load tickets' });
  }
});

router.patch('/helpdesk/tickets/:id', auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { admin_reply, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE helpdesk_tickets
       SET admin_reply = $1, status = $2, replied_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [admin_reply, status || 'replied', id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Ticket not found' });
    
    const ticket = result.rows[0];

    try {
      const userRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [ticket.user_id]);
      const user = userRes.rows[0];
      if (user && user.email) {
        await sendTicketReply({
          to: user.email,
          name: user.name,
          subject: ticket.subject,
          reply: ticket.admin_reply
        });
      }
    } catch (mailErr) {
      console.error('Failed to send reply email:', mailErr.message);
    }

    res.json({ success: true, ticket });
  } catch (err) {
    console.error('Reply ticket error:', err);
    res.status(500).json({ error: 'Failed to reply' });
  }
});

/* ============================================================
   PAYMENTS (RAZORPAY & UPI MANUAL)
   ============================================================ */

router.post('/create-order', auth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.post('/payments', auth, async (req, res) => {
  const { 
    course_name, amount, payment_method, payment_type, 
    razorpay_payment_id, razorpay_order_id, razorpay_signature 
  } = req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  try {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature. Payment is fake.' });
    }

    const enrolled = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_name = $2',
      [req.user.id, course_name]
    );
    if (enrolled.rows.length) {
      return res.status(409).json({ error: 'Already enrolled' });
    }

    const receiptNumber = `KEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const paymentRes = await pool.query(
      `INSERT INTO payments (user_id, course_name, amount, payment_method, payment_type, status, receipt_number)
       VALUES ($1, $2, $3, $4, $5, 'completed', $6)
       RETURNING *`,
      [req.user.id, course_name, amount, payment_method || 'Razorpay', payment_type || 'deposit', receiptNumber]
    );

    await pool.query(
      'INSERT INTO enrollments (user_id, course_name) VALUES ($1, $2)',
      [req.user.id, course_name]
    );

    res.json({
      success: true,
      payment: paymentRes.rows[0],
      message: 'Payment verified and enrollment confirmed!',
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

/* --- NEW: MANUAL UPI PAYMENT SUBMISSION --- */
router.post('/manual-payment', auth, async (req, res) => {
  const { course_name, amount, utr } = req.body;

  if (!course_name || !amount || !utr) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const receiptNumber = `KEC-UPI-${Date.now()}`;
    
    // Save payment with 'pending' status
    const paymentRes = await pool.query(
      `INSERT INTO payments (user_id, course_name, amount, payment_method, status, receipt_number, utr_number)
       VALUES ($1, $2, $3, 'UPI', 'pending', $4, $5)
       RETURNING *`,
      [req.user.id, course_name, amount, receiptNumber, utr]
    );

    res.json({ success: true, payment: paymentRes.rows[0] });
  } catch (err) {
    console.error('Manual payment error:', err);
    res.status(500).json({ error: 'Failed to save manual payment' });
  }
});

/* --- NEW: FETCH PENDING PAYMENTS FOR ADMIN --- */
router.get('/pending-payments', auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM payments p
       JOIN users u ON u.id = p.user_id
       WHERE p.status = 'pending'
       ORDER BY p.paid_at DESC`
    );
    res.json({ payments: result.rows });
  } catch (err) {
    console.error('Pending payments error:', err);
    res.status(500).json({ error: 'Failed to load pending payments' });
  }
});

/* --- NEW: APPROVE UPI PAYMENT --- */
router.post('/approve-payment/:id', auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Update status to completed
    const result = await pool.query(
      `UPDATE payments SET status = 'completed' WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: 'Payment not found' });
    
    const payment = result.rows[0];

    // 2. Automatically enroll the student in the course
    const enrolled = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_name = $2',
      [payment.user_id, payment.course_name]
    );
    
    if (!enrolled.rows.length) {
      await pool.query(
        'INSERT INTO enrollments (user_id, course_name) VALUES ($1, $2)',
        [payment.user_id, payment.course_name]
      );
    }

    res.json({ success: true, payment });
  } catch (err) {
    console.error('Approve payment error:', err);
    res.status(500).json({ error: 'Failed to approve payment' });
  }
});

router.get('/payments/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM payments p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND (p.user_id = $2 OR $3 = 'admin')`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Receipt not found' });
    res.json({ payment: result.rows[0] });
  } catch (err) {
    console.error('Receipt error:', err);
    res.status(500).json({ error: 'Failed to load receipt' });
  }
});

router.get('/payments', auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name AS user_name, u.email AS user_email
       FROM payments p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.paid_at DESC`
    );
    res.json({ payments: result.rows });
  } catch (err) {
    console.error('All payments error:', err);
    res.status(500).json({ error: 'Failed to load payments' });
  }
});

module.exports = router;