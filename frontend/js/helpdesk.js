/* ============================================================
   KIRAN ENOSH — HELPDESK.JS
   ============================================================ */

const API_ADMIN_HD = '/api/admin';

async function loadMyCourses() {
  const container = document.getElementById('myCoursesList');
  if (!container) return;

  try {
    const res = await fetch(`${API_ADMIN_HD}/my-courses`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();

    if (!data.courses.length) {
      container.innerHTML = `<p style="color:#7a89a8;grid-column:1/-1;">You haven't enrolled in any courses yet. <a href="courses.html" style="color:#ff7b00;font-weight:600;">Browse courses →</a></p>`;
      return;
    }

    container.innerHTML = data.courses.map(c => `
      <div class="dash-card">
        <h3> ${c.course_name}</h3>
        <p style="font-size:12px;color:#7a89a8;margin-top:8px;">Enrolled on ${new Date(c.enrolled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="margin-top:10px;color:#7fffaf;font-size:13px;">✓ Active</p>
      </div>
    `).join('');
  } catch (err) {
    console.error('My courses error:', err);
    container.innerHTML = `<p style="color:#ff8a8a;grid-column:1/-1;">Failed to load your courses.</p>`;
  }
}

const helpdeskForm = document.getElementById('helpdeskForm');
if (helpdeskForm) {
  helpdeskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('helpdeskSubmitBtn');
    const msgBox = document.getElementById('helpdeskMessage');
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!subject || !message) return showMsg('Please fill both fields.', 'error');
    if (message.length < 10) return showMsg('Please describe your issue in more detail.', 'error');

    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const res = await fetch(`${API_ADMIN_HD}/helpdesk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        btn.disabled = false;
        btn.textContent = 'Send to Support';
        return showMsg(data.error || 'Failed to send.', 'error');
      }

      showMsg(`✅ Thank you ${data.user.name}! Your ticket #${data.ticket_id} has been received. Our team will contact you within 24 hours via email (${data.user.email}) and phone (${data.user.phone}).`, 'success');
      helpdeskForm.reset();
      btn.disabled = false;
      btn.textContent = 'Send to Support';
    } catch (err) {
      console.error('Helpdesk error:', err);
      btn.disabled = false;
      btn.textContent = 'Send to Support';
      showMsg('Cannot reach server.', 'error');
    }
  });
}

function showMsg(text, type) {
  const box = document.getElementById('helpdeskMessage');
  box.textContent = text;
  box.style.display = 'block';
  if (type === 'error') {
    box.style.background = 'rgba(255,60,60,0.15)';
    box.style.border = '1px solid rgba(255,60,60,0.4)';
    box.style.color = '#ff8a8a';
  } else {
    box.style.background = 'rgba(80,220,120,0.15)';
    box.style.border = '1px solid rgba(80,220,120,0.4)';
    box.style.color = '#7fffaf';
  }
}

loadMyCourses();
console.log(' Helpdesk loaded');