/* ============================================================
   Send a helpdesk notification to the admin
   ============================================================ */
async function sendHelpdeskNotification({ student, subject, message, ticketId }) {
  // Where does the admin notification go?
  // Reads from .env — set ADMIN_EMAIL there
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f6f8fc; padding: 30px 20px;">
      <div style="background: #0a1128; padding: 22px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #ff7b00; margin: 0; font-size: 22px;">🎫 NEW HELPDESK TICKET</h1>
        <p style="color: #c3cce0; margin: 5px 0 0; font-size: 13px; letter-spacing: 1px;">KIRAN ENOSH ADMIN ALERT</p>
      </div>

      <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <p style="color: #666; font-size: 13px; margin: 0 0 5px;">Ticket #${ticketId}</p>
        <p style="color: #666; font-size: 13px; margin: 0 0 25px;">${new Date().toLocaleString('en-IN')}</p>

        <h2 style="color: #0a1128; font-size: 20px; margin: 0 0 20px;">Student Details</h2>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; width: 90px;">Name:</td>
            <td style="padding: 8px 0; color: #000; font-weight: 600; font-size: 14px;">${student.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${student.email}" style="color: #0a4da6; font-weight: 600; font-size: 14px; text-decoration: none;">${student.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Phone:</td>
            <td style="padding: 8px 0;"><a href="tel:${student.phone}" style="color: #0a4da6; font-weight: 600; font-size: 14px; text-decoration: none;">${student.phone}</a></td>
          </tr>
        </table>

        <h2 style="color: #0a1128; font-size: 20px; margin: 0 0 15px;">Subject</h2>
        <p style="background: #f6f8fc; padding: 15px; border-radius: 8px; color: #333; font-size: 15px; margin: 0 0 25px; border-left: 4px solid #ff7b00;">
          ${subject}
        </p>

        <h2 style="color: #0a1128; font-size: 20px; margin: 0 0 15px;">Message</h2>
        <p style="background: #f6f8fc; padding: 15px; border-radius: 8px; color: #333; font-size: 15px; line-height: 1.7; margin: 0 0 25px; border-left: 4px solid #0a4da6; white-space: pre-wrap;">
          ${message}
        </p>

        <p style="color: #666; font-size: 13px; margin: 30px 0 0; padding-top: 20px; border-top: 1px solid #eee;">
          <strong>Reply to this student within 24 hours</strong> as promised in the helpdesk form.
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: adminEmail,
    replyTo: student.email,
    subject: `🎫 Helpdesk Ticket #${ticketId} — ${subject}`,
    html: html,
  };

  return transporter.sendMail(mailOptions);
}

async function sendHelpdeskNotification({ student, subject, message, ticketId }) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6f8fc; padding: 30px;">
      <h1 style="color: #ff7b00;">🎫 NEW HELPDESK TICKET #${ticketId}</h1>
      <p><strong>Student Name:</strong> ${student.name}</p>
      <p><strong>Email:</strong> ${student.email}</p>
      <p><strong>Phone:</strong> ${student.phone}</p>
      <hr style="border: 1px solid #ddd; margin: 20px 0;">
      <h3>Subject: ${subject}</h3>
      <p style="background: #fff; padding: 15px; border-left: 4px solid #4a90e2;">${message}</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">Reply to this email to contact the student directly.</p>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: adminEmail,
    replyTo: student.email, // Admin can click "Reply" and it will go to student
    subject: `🎫 Helpdesk #${ticketId} - ${subject}`,
    html: html,
  });
}

async function sendHelpdeskConfirmation({ student, subject, ticketId }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6f8fc; padding: 30px;">
      <h1 style="color: #0a1128;">We received your query!</h1>
      <p>Hi ${student.name},</p>
      <p>Thank you for contacting Kiran Enosh. We have received your ticket <strong>#${ticketId}</strong> regarding: <em>${subject}</em>.</p>
      <p>Our team will get in touch with you at <strong>${student.email}</strong> and <strong>${student.phone}</strong> within 24 hours.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated confirmation. Please do not reply to this email.</p>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: student.email,
    subject: `✅ We received your query #${ticketId}`,
    html: html,
  });
}