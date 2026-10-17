const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

/* ============================================================
   ADMIN ROUTES
   ============================================================ */

router.post('/admin/session', auth, requireAdmin, async (req, res) => {
  const { course_name, meet_link, meet_password, session_date } = req.body;
  
  if (!course_name || !meet_link || !session_date) {
    return res.status(400).json({ error: 'Course, link, and date are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO live_sessions (course_name, meet_link, meet_password, session_date) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (course_name, session_date) 
       DO UPDATE SET meet_link = EXCLUDED.meet_link, meet_password = EXCLUDED.meet_password
       RETURNING *`,
      [course_name, meet_link, meet_password, session_date]
    );
    res.json({ success: true, session: result.rows[0] });

  } catch (err) {
    console.error('Set session error:', err);
    res.status(500).json({ error: 'Failed to save session link' });
  }
});

// Get all pending attendance for a date
router.get('/admin/attendance', auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.course_name, a.session_date, a.status, a.marked_at, 
              u.name AS student_name, u.email AS student_email
       FROM attendance a
       JOIN users u ON u.id = a.user_id
       ORDER BY a.session_date DESC, a.marked_at DESC`
    );
    res.json({ attendance: result.rows });
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ error: 'Failed to load attendance' });
  }
});

// Approve or Reject attendance
router.patch('/admin/attendance/:id', auth, requireAdmin, async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  try {
    const result = await pool.query(
      'UPDATE attendance SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json({ success: true, attendance: result.rows[0] });
  } catch (err) {
    console.error('Update attendance error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/* ============================================================
   STUDENT ROUTES
   ============================================================ */

// Get today's link and current attendance status for a course
router.get('/student/session/:course', auth, async (req, res) => {
  const { course } = req.params;
  const today = req.query.date; // Format: YYYY-MM-DD

  try {
    // Check if enrolled
    const enrolled = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_name = $2',
      [req.user.id, course]
    );
    if (!enrolled.rows.length) return res.status(403).json({ error: 'Not enrolled in this course' });

    // Get today's link
    const session = await pool.query(
      'SELECT meet_link FROM live_sessions WHERE course_name = $1 AND session_date = $2',
      [course, today]
    );

    // Get today's attendance status
    const attendance = await pool.query(
      'SELECT status FROM attendance WHERE user_id = $1 AND course_name = $2 AND session_date = $3',
      [req.user.id, course, today]
    );

    res.json({
      meet_link: session.rows.length ? session.rows[0].meet_link : null,
      attendance_status: attendance.rows.length ? attendance.rows[0].status : null,
    });
  } catch (err) {
    console.error('Get student session error:', err);
    res.status(500).json({ error: 'Failed to load session details' });
  }
});

// Mark attendance
router.post('/student/attendance', auth, async (req, res) => {
  const { course_name, session_date } = req.body;

  try {
    // Verify they are enrolled
    const enrolled = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_name = $2',
      [req.user.id, course_name]
    );
    if (!enrolled.rows.length) return res.status(403).json({ error: 'Not enrolled in this course' });

    // Insert attendance as 'pending'
    const result = await pool.query(
      `INSERT INTO attendance (user_id, course_name, session_date, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (user_id, course_name, session_date) 
       DO NOTHING RETURNING *`,
      [req.user.id, course_name, session_date]
    );

    if (!result.rows.length) {
      return res.status(409).json({ error: 'Attendance already marked for today' });
    }

    res.json({ success: true, message: 'Attendance marked as pending. Admin will verify after class.' });
  } catch (err) {
    console.error('Mark attendance error:', err);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

module.exports = router;