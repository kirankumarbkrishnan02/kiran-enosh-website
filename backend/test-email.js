require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing email with user:', process.env.EMAIL_USER);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    logger: true,
    debug: true,
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Nodemailer Test from KEC Website',
      text: 'If you see this, your email setup is perfect!',
    });
    console.log('✅ SUCCESS! Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ FAILED TO SEND:', error.message);
  }
}

testEmail();