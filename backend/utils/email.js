const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function expects 3 separate arguments
async function sendPasswordResetEmail(userEmail, userName, resetLink) {
  const mailOptions = {
    from: `"KEC Group of Institutions" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Password Reset Request - KEC Group of Institutions',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ff7b00;">KEC Group of Institutions</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #ff7b00; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = sendPasswordResetEmail;