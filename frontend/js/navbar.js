/* ============================================================
   KIRAN ENOSH — REUSABLE LOGGED-IN NAVBAR
   Drop this on any authenticated page to get a consistent menu.
   Add <div id="kecNavbar"></div> + <script src="js/navbar.js"></script>
   ============================================================ */

(function () {
  'use strict';

  var AUTH_API = '/api/auth';

  // Detect current page for highlighting the active link
  function currentPage() {
    var path = window.location.pathname.split('/').pop();
    return path || 'index.html';
  }

  // Render the navbar HTML
  function renderNavbar(user) {
    var page = currentPage();
    var isAdmin = user && user.role === 'admin';
    var dashboardUrl = isAdmin ? 'admin-dashboard.html' : 'dashboard.html';

    var links = [
      { href: 'index.html', label: '🏠 Home', match: 'index.html' },
      { href: dashboardUrl, label: '📊 Dashboard', match: 'dashboard.html,admin-dashboard.html' },
      { href: 'courses.html', label: '📚 Courses', match: 'courses.html' },
      { href: 'about.html', label: '🎬 Our Story', match: 'about.html' },
    ];

    if (isAdmin) {
      links.push({ href: 'admin.html', label: '🛡️ Admin', match: 'admin.html' });
    }

    links.push({ href: 'dashboard.html#support', label: '📞 Help', match: '' });

    var linksHtml = '';
    for (var i = 0; i < links.length; i++) {
      var l = links[i];
      var matches = l.match.split(',');
      var isActive = matches.indexOf(page) !== -1 ? ' active' : '';
      linksHtml += '<a href="' + l.href + '" class="ln-link' + isActive + '">' + l.label + '</a>';
    }

    var userName = user ? user.name : 'User';

    var html =
      '<div class="ln-left">' +
        '<img src="images/logo.png" class="ln-logo" alt="Kiran Enosh" />' +
        '<div class="ln-brand-text">KIRAN ENOSH<span>' + (isAdmin ? 'ADMIN PORTAL' : 'STUDENT PORTAL') + '</span></div>' +
      '</div>' +
      '<div class="ln-center">' + linksHtml + '</div>' +
      '<div class="ln-right">' +
        '<span class="ln-user"><span class="dot"></span><span>' + escapeHtml(userName) + '</span></span>' +
        '<a href="#" id="kecLogoutBtn" class="ln-logout">Logout</a>' +
      '</div>';

    var container = document.getElementById('kecNavbar');
    if (container) {
      container.className = 'logged-navbar';
      container.innerHTML = html;
      document.body.classList.add('has-logged-navbar');
    }

    // Wire up logout
    var btn = document.getElementById('kecLogoutBtn');
    if (btn) {
      btn.addEventListener('click', async function (e) {
        e.preventDefault();
        try {
          await fetch(AUTH_API + '/logout', { method: 'POST', credentials: 'include' });
        } catch (err) {
          console.error('Logout error:', err);
        }
        window.location.href = 'index.html';
      });
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Fetch user and render
  fetch(AUTH_API + '/me', { credentials: 'include' })
    .then(function (r) {
      if (!r.ok) {
        window.location.href = 'login.html';
        throw new Error('Not authenticated');
      }
      return r.json();
    })
    .then(function (data) {
      renderNavbar(data.user);
    })
    .catch(function (err) {
      console.error('Navbar error:', err);
    });
})();