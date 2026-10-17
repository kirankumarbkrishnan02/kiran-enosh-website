const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

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

/* ============ GET ALL COURSES ============ */
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

/* ============ ENROLL IN COURSE ============ */
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

/* ============ MY ENROLLMENTS ============ */
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

/* ============ SUBMIT HELPDESK TICKET ============ */
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
    const user = userRes.rows[0];
    const ticketRes = await pool.query(
      `INSERT INTO helpdesk_tickets (user_id, subject, message)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [req.user.id, subject, message]
    );
    console.log('📩 New Helpdesk Ticket:');
    console.log(`  ID: #${ticketRes.rows[0].id}`);
    console.log(`  From: ${user.name} <${user.email}>`);
    console.log(`  Phone: ${user.phone}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Message: ${message}`);
    res.json({
      success: true,
      ticket_id: ticketRes.rows[0].id,
      message: 'Thank you! Our team will contact you within 24 hours.',
      user: { name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error('Helpdesk error:', err);
    res.status(500).json({ error: 'Failed to submit ticket' });
  }
});

/* ============ GET ALL TICKETS (admin) ============ */
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

/* ============ REPLY TO TICKET (admin) ============ */
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
    res.json({ success: true, ticket: result.rows[0] });
  } catch (err) {
    console.error('Reply ticket error:', err);
    res.status(500).json({ error: 'Failed to reply' });
  }
});

/* ============================================================
   PAYMENTS
   ============================================================ */

/* ============ CREATE PAYMENT RECORD (after "I have paid") ============ */
router.post('/payments', auth, async (req, res) => {
  const { course_name, amount, payment_method, payment_type, payment_plan, installment_months } = req.body;

  if (!course_name || !amount) {
    return res.status(400).json({ error: 'Course name and amount required' });
  }

  try {
    // Check if user is already enrolled
    const enrolled = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_name = $2',
      [req.user.id, course_name]
    );
    if (enrolled.rows.length) {
      return res.status(409).json({ error: 'Already enrolled in this course' });
    }

    // Generate unique receipt number
    const receiptNumber = `KEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Insert payment record (Note: If your DB doesn't have payment_plan columns yet, this will still work but won't save the plan. We log it below).
    const paymentRes = await pool.query(
      `INSERT INTO payments (user_id, course_name, amount, payment_method, payment_type, status, receipt_number)
       VALUES ($1, $2, $3, $4, $5, 'completed', $6)
       RETURNING *`,
      [
        req.user.id,
        course_name,
        amount,
        payment_method || 'UPI',
        payment_type || 'deposit',
        receiptNumber,
      ]
    );

    // Auto-enroll the student
    await pool.query(
      'INSERT INTO enrollments (user_id, course_name) VALUES ($1, $2)',
      [req.user.id, course_name]
    );

    // 🌟 THIS IS THE CONSOLE LOG YOU ASKED FOR 🌟
    console.log('===================================================');
    console.log(`✅ PAYMENT SUCCESSFUL: ${course_name}`);
    console.log(`💰 Amount Paid Now: ₹${amount}`);
    console.log(`📅 Payment Plan: ${payment_plan === 'full' ? 'Full Payment' : installment_months + ' Months Installment'}`);
    console.log(`💳 Method: ${payment_method}`);
    console.log(`🧾 Receipt: ${receiptNumber}`);
    console.log('===================================================');

    res.json({
      success: true,
      payment: paymentRes.rows[0],
      message: 'Payment recorded and enrollment confirmed!',
    });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

/* ============ GET MY PAYMENTS ============ */
router.get('/payments/my', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM payments p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1
       ORDER BY p.paid_at DESC`,
      [req.user.id]
    );
    res.json({ payments: result.rows });
  } catch (err) {
    console.error('My payments error:', err);
    res.status(500).json({ error: 'Failed to load payments' });
  }
});

/* ============ GET SINGLE PAYMENT RECEIPT ============ */
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

/* ============ GET ALL PAYMENTS (admin) ============ */
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