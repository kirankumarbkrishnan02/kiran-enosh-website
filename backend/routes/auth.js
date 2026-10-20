const express = require('express');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const sendPasswordResetEmail = require('../utils/email');

const router = express.Router();



/* ============ REGISTER ============ */
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Full name is too short'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('phone').isLength({ min: 10, max: 15 }).withMessage('Invalid phone number'),
    body('father_name').trim().notEmpty().withMessage("Father's name is required"),
    body('mother_name').trim().notEmpty().withMessage("Mother's name is required"),
    body('gender').notEmpty().withMessage('Gender is required'),
    body('dob').notEmpty().withMessage('Date of birth is required'),
    body('last_education').notEmpty().withMessage('Last education is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Must include an uppercase letter')
      .matches(/[0-9]/).withMessage('Must include a number')
      .matches(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`';]/).withMessage('Must include a symbol'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { 
      name, email, phone, password, 
      father_name, mother_name, gender, dob, last_education, address 
    } = req.body;

    try {
      const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

      const hash = await bcrypt.hash(password, 12);
      
      // Insert with all new fields
      const result = await pool.query(
        `INSERT INTO users (name, email, phone, password_hash, father_name, mother_name, gender, dob, last_education, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, name, email, phone, role, created_at`,
        [name, email, phone, hash, father_name, mother_name, gender, dob, last_education, address]
      );

      const user = result.rows[0];
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(201).json({ success: true, user });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ============ LOGIN ============ */
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const result = await pool.query(
        'SELECT id, name, email, phone, role, password_hash FROM users WHERE email = $1',
        [email]
      );
      if (!result.rows.length)
        return res.status(401).json({ error: 'Invalid credentials' });

      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES }
      );

        res.cookie('token', token, {
        httpOnly: true,
        secure: true,            // MUST be true for cross-site cookies
        sameSite: 'none',        // MUST be 'none' to allow Vercel to read it
        maxAge: 24 * 60 * 60 * 1000,
      });
      delete user.password_hash;
      res.json({ success: true, user });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ============ LOGOUT ============ */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

/* ============ ME ============ */
router.get('/me', require('../middleware/auth'), async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json({ user: result.rows[0] });
});
/* ============================================================
   FORGOT PASSWORD — Request a reset link
   ============================================================ */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const userRes = await pool.query(
      'SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    // Always return success even if user doesn't exist (prevents email enumeration)
    if (!userRes.rows.length) {
      return res.json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      });
    }

    const user = userRes.rows[0];

    // Generate secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Clear any previous tokens for this user
    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);

    // Save hashed token
    await pool.query(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );

    // Build reset link
        // Inside your /forgot-password route
    const resetLink = `${process.env.CLIENT_URL}/reset-password.html?token=${rawToken}`;
    
    // Call the function with the correct arguments
    await sendPasswordResetEmail(user.email, user.name, resetLink);
    
    res.json({ message: 'Password reset link sent to your email.' });

    // ---- SEND EMAIL ----
    let emailSent = false;
    let emailError = null;

    try {
       sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetLink: resetLink,
      });
      emailSent = true;
      console.log(` Reset email sent to ${user.email}`);
    } catch (mailErr) {
      emailError = mailErr.message;
      console.error('❌ Failed to send reset email:', mailErr.message);
      // Still log the link to terminal as a fallback
      console.log('');
      console.log('═══════════════════════════════════════════════');
      console.log(' PASSWORD RESET LINK (email failed)');
      console.log('═══════════════════════════════════════════════');
      console.log(`  User:  ${user.name} <${user.email}>`);
      console.log(`  Link:  ${resetLink}`);
      console.log('═══════════════════════════════════════════════');
      console.log('');
    }

    res.json({
      succeawaitss: true,
      message: 'If that email exists, a reset link has been sent.',
      email_sent: emailSent,
      // Development helpers — remove in production
      ...(process.env.NODE_ENV !== 'production' && {
        dev_reset_link: resetLink,
        dev_email_error: emailError,
      }),
    });
    } catch (err) {
  console.error('Forgot password error:', err);
  res.status(500).json({ error: 'BACKEND ERROR: ' + err.message });
}
});
/* ============================================================
   FORGOT PASSWORD — Request a reset link
   ============================================================ */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const userRes = await pool.query(
      'SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (!userRes.rows.length) {
      return res.json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      });
    }

    const user = userRes.rows[0];

    // 1. Generate secure random token (VARIABLE IS CALLED rawToken)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // 2. Clear any previous tokens for this user
    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);

    // 3. Save hashed token
    await pool.query(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );

    // 4. Build reset link (USING rawToken, not resetToken!)
    const resetLink = `${process.env.CLIENT_URL}/reset-password.html?token=${rawToken}`;

    // 5. Send email
    try {
      await sendPasswordResetEmail(user.email, user.name, resetLink);
      console.log(`✅ Reset email sent to ${user.email}`);
    } catch (mailErr) {
      console.error('❌ Failed to send reset email:', mailErr.message);
      return res.status(500).json({ error: 'Failed to send email. Check backend logs.' });
    }

    // 6. Send single success response
    return res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    // Make sure this line is back to normal (no BACKEND ERROR: text)
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});
module.exports = router;