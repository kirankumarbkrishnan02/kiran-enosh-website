/* ============================================================
   KIRAN ENOSH — DASHBOARD.JS
   ============================================================ */

const API_BASE = 'https://kiran-enosh-backend.onrender.com/api/auth';
const ADMIN_API = 'https://kiran-enosh-backend.onrender.com/api/admin';

let currentUser = null;

/* ============================================================
   FETCH CURRENT USER
   ============================================================ */
async function loadUser() {
  try {
    const response = await fetch(`${API_BASE}/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      window.location.href = 'login.html';
      return;
    }

    const data = await response.json();
    currentUser = data.user;

    // Fill user info
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userRole').textContent = currentUser.role;

    // Show admin panel button if user is admin
    const adminBtn = document.getElementById('adminPanelBtn');
    if (adminBtn && currentUser.role === 'admin') {
      adminBtn.style.display = 'inline-flex';
    }

    // Member since date
    const date = new Date(currentUser.created_at);
    const formatted = date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    document.getElementById('memberSince').textContent = formatted;

    // Update navbar text if admin
    const portalText = document.getElementById('portalType');
    // Redirect admins to their own dashboard
if (currentUser.role === 'admin') {
  window.location.href = 'admin-dashboard.html';
  return;
}

    // Load enrolled course count
    await loadEnrolledCount();
  } catch (err) {
    console.error('Load user error:', err);
    window.location.href = 'login.html';
  }
}

/* ============================================================
   COUNT ENROLLED COURSES
   ============================================================ */
async function loadEnrolledCount() {
  try {
    const res = await fetch(`${ADMIN_API}/my-courses`, { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    const countEl = document.getElementById('courseCount');
    if (countEl) countEl.textContent = data.courses.length;
  } catch (err) {
    console.error('Enroll count error:', err);
  }
}

/* ============================================================
   LOGOUT
   ============================================================ */
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    window.location.href = 'index.html';
  });
}

/* ============================================================
   INIT
   ============================================================ */
loadUser();

console.log('📊 Dashboard script loaded');