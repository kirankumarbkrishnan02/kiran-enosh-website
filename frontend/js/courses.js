/* KIRAN ENOSH — COURSES.JS (Gated Access) */

// Use the live Vercel proxy to avoid CORS issues
var API = '/api/admin';
var AUTH = '/api/auth';
var currentUser = null;

// Fetch user to check if logged in
async function checkUser() {
  try {
    const r = await fetch(AUTH + '/me', { credentials: 'include' });
    if (r.ok) {
      const data = await r.json();
      currentUser = data.user;
      const nameEl = document.getElementById('userNameNav');
      if (nameEl) {
        nameEl.textContent = currentUser.name;
        document.getElementById('userPill').style.display = 'inline-flex';
      }
    }
  } catch (err) {
    console.log('Not logged in');
  }
}

async function renderCourses() {
  var grid = document.getElementById('coursesGrid');
  if (!grid) return;

  try {
    // Fetch courses
    var res = await fetch(API + '/courses', { credentials: 'include' });
    var data = await res.json();
    var html = '';

    for (var i = 0; i < data.courses.length; i++) {
      var c = data.courses[i];

      // HIDE PRICE FOR NON-LOGGED IN USERS
      var priceHtml = '';
      if (currentUser) {
        priceHtml = '<span class="course-price">₹' + c.price.toLocaleString('en-IN') + '</span>';
      } else {
        priceHtml = '<span class="course-price" style="color:#ff7b00; font-size:16px; font-weight:600;">Login to see fees</span>';
      }

      // Button Logic
      var btnUrl = currentUser ? 'course-details.html?course=' + encodeURIComponent(c.title) + '&price=' + c.price : 'login.html';
      var btnText = currentUser ? 'View & Enroll' : 'Login to Enroll';
      var btnClass = currentUser ? 'btn-primary' : 'btn-outline';

      html += '<div class="course-card reveal visible">' +
        '<div>' +
          '<div class="course-icon" style="margin-bottom:15px;">' +
            '<img src="images/logo.png" style="width:60px; height:60px; object-fit:contain;" />' +
          '</div>' +
          '<h4>' + c.title + '</h4>' +
          '<p>' + c.description + '</p>' +
        '</div>' +
        '<div>' +
          priceHtml +
          '<br>' +
          '<a href="' + btnUrl + '" class="btn ' + btnClass + '" style="display:block; width:100%; text-align:center; margin-top:10px;">' + btnText + ' →</a>' +
        '</div>' +
      '</div>';
    }
    grid.innerHTML = html;
  } catch (err) {
    console.error('Error loading courses:', err);
    grid.innerHTML = '<p style="color:#ff8a8a; grid-column:1/-1; text-align:center;">Failed to load courses. Please refresh.</p>';
  }
}

// Init
checkUser().then(() => renderCourses());