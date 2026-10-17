/* ============================================================
   KIRAN ENOSH — ADMIN.JS (Fixed URL)
   ============================================================ */

// ⚠️ CORRECT API BASE — must be /api/admin (not /api/auth/admin)
const API = 'https://kiran-enosh-backend.onrender.com/api';
const AUTH_API = 'https://kiran-enosh-backend.onrender.com/api/auth';

let allUsers = [];

/* ============================================================
   INIT
   ============================================================ */
async function init() {
  try {
    // Verify user is admin
    const meRes = await fetch(`${AUTH_API}/me`, { credentials: 'include' });
    if (!meRes.ok) {
      window.location.href = 'login.html';
      return;
    }
    const { user } = await meRes.json();

    if (user.role !== 'admin') {
      alert('❌ Access Denied. This page is for admins only.');
      window.location.href = 'dashboard.html';
      return;
    }

    document.getElementById('adminName').textContent = user.name;

    // Load stats and users
    await loadStats();
    await loadUsers();

    // Wire up search & filter
    document.getElementById('searchInput').addEventListener('input', renderUsers);
    document.getElementById('roleFilter').addEventListener('change', renderUsers);

  } catch (err) {
    console.error('Init error:', err);
    alert('Cannot reach server. Is the backend running?');
  }
}

/* ============================================================
   LOAD STATS
   ============================================================ */
async function loadStats() {
  try {
    const res = await fetch(`${API}/admin/stats`, { credentials: 'include' });
    if (!res.ok) throw new Error('Stats fetch failed');
    const data = await res.json();

    document.getElementById('totalUsers').textContent = data.users;
    document.getElementById('totalCourses').textContent = data.courses;
    document.getElementById('totalEnrollments').textContent = data.enrollments;
  } catch (err) {
    console.error('Stats error:', err);
  }
}

/* ============================================================
   LOAD USERS
   ============================================================ */
async function loadUsers() {
  try {
    const res = await fetch(`${API}/admin/users`, { credentials: 'include' });
    if (!res.ok) throw new Error('Users fetch failed');
    const data = await res.json();

    allUsers = data.users || [];
    renderUsers();
  } catch (err) {
    console.error('Users error:', err);
    document.getElementById('usersTable').innerHTML =
      `<tr><td colspan="7" class="empty-state">Failed to load users.</td></tr>`;
  }
}

/* ============================================================
   RENDER USERS
   ============================================================ */
function renderUsers() {
  const search = document.getElementById('searchInput').value.toLowerCase().trim();
  const roleFilter = document.getElementById('roleFilter').value;

  const filtered = allUsers.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      (u.phone || '').includes(search);

    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const countEl = document.getElementById('visibleCount');
  if (countEl) countEl.textContent = filtered.length;

  const tbody = document.getElementById('usersTable');

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No users match your search.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((u) => `
    <tr>
      <td>#${u.id}</td>
      <td><strong>${escapeHtml(u.name)}</strong></td>
      <td>${escapeHtml(u.email)}</td>
      <td class="hide-mobile">${escapeHtml(u.phone || '—')}</td>
      <td><span class="role-badge ${u.role}">${u.role}</span></td>
      <td class="hide-mobile">${formatDate(u.created_at)}</td>
      <td>
        <button class="action-btn" onclick="deleteUser(${u.id}, '${escapeHtml(u.name).replace(/'/g, "\\'")}')">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

/* ============================================================
   DELETE USER
   ============================================================ */
async function deleteUser(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`${API}/admin/users/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      alert('❌ ' + (data.error || 'Failed to delete'));
      return;
    }

    alert('✅ User deleted');
    await loadUsers();
    await loadStats();
  } catch (err) {
    console.error('Delete error:', err);
    alert('Cannot reach server.');
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
      await fetch(`${AUTH_API}/logout`, { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    window.location.href = 'index.html';
  });
}

/* ============================================================
   HELPERS
   ============================================================ */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ============================================================
   BOOT
   ============================================================ */
init();
console.log('🛡️ Admin script loaded');