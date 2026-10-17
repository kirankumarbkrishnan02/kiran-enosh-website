/* KIRAN ENOSH — COURSES.JS (Direct link version with Images) */

console.log('=== courses.js v14 starting ===');

var API = '';
var AUTH = '';

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function renderCourses(courses, enrolled) {
  console.log('=== Rendering ' + courses.length + ' courses ===');
  var grid = document.getElementById('coursesGrid');
  var html = '';

  for (var i = 0; i < courses.length; i++) {
    var c = courses[i];
    var isEnrolled = enrolled.indexOf(c.title) !== -1;
    var payUrl = 'payment.html?course=' + encodeURIComponent(c.title) + '&price=' + c.price;

    // --- 1. MATCH COURSE TITLE TO THE .PNG IMAGE ---
    var imgSrc = '';
    var titleLower = (c.title || '').toLowerCase();
    
    if (titleLower.includes('python')) imgSrc = 'images/python.png';
    else if (titleLower.includes('java')) imgSrc = 'images/java.png';
    else if (titleLower.includes('cyber')) imgSrc = 'images/cyber.png';
    else if (titleLower.includes('data')) imgSrc = 'images/datascience.png';
    else if (titleLower.includes('linux')) imgSrc = 'images/linux.png';
    else if (titleLower.includes('ai') || titleLower.includes('artificial')) imgSrc = 'images/ai.png';
    else if (titleLower.includes('full') || titleLower.includes('stack')) imgSrc = 'images/fullstack.png';

    // --- 2. BUILD THE ICON OR IMAGE HTML ---
    var iconContent = '';
    if (imgSrc) {
      // If an image matched, use the <img> tag (sized to fit your existing layout)
      iconContent = '<img src="' + imgSrc + '" alt="' + esc(c.title) + '" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">';
    } else {
      // Fallback to the emoji if no image matched
      iconContent = c.icon || '📚';
    }

    // --- 3. RENDER THE COURSE CARD ---
    html += '<div class="course-card reveal visible">' +
      '<div>' +
        '<div class="course-icon" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 15px;">' + 
          iconContent + 
        '</div>' +
        '<h4>' + esc(c.title) + '</h4>' +
        '<p>' + esc(c.description || '') + '</p>' +
      '</div>' +
      '<div>' +
        '<span class="course-price">₹' + (c.price || 0).toLocaleString('en-IN') + '</span>' +
        '<span class="course-duration">' + c.duration_weeks + ' weeks</span>' +
        '<br>';

    if (isEnrolled) {
      html += '<button class="course-enroll-btn enrolled" disabled>✓ Enrolled</button>';
    } else {
      html += '<a href="' + payUrl + '" class="course-enroll-btn">Enroll Now →</a>';
    }

    html += '</div></div>';
  }

  grid.innerHTML = html;
  console.log('=== Rendered successfully ===');
}

// --- FETCH DATA AND RUN ---
fetch(AUTH + '/me', { credentials: 'include' })
  .then(function (r) {
    // If the backend says 401 Unauthorized, redirect to login
    if (r.status === 401) {
      window.location.href = 'login.html';
      return null; 
    }
    if (!r.ok) throw new Error('Server error: ' + r.status);
    return r.json();
  })
  .then(function (meData) {
    if (!meData) return; // Stop if we redirected

    var pill = document.getElementById('userPill');
    var nameEl = document.getElementById('userNameNav');
    if (pill && nameEl) {
      nameEl.textContent = meData.user.name;
      pill.style.display = 'inline-flex';
    }
    return fetch(API + '/my-courses', { credentials: 'include' });
  })
  .then(function (r) { 
    if (!r) return; 
    return r.json(); 
  })
  .then(function (enrData) {
    if (!enrData) return; 
    var enrolled = enrData.courses.map(function (c) { return c.course_name; });
    return fetch(API + '/courses', { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (courseData) {
        renderCourses(courseData.courses, enrolled);
      });
  })
  .catch(function (err) {
    console.error('ERROR:', err);
    var g = document.getElementById('coursesGrid');
    if (g) g.innerHTML = '<p style="color:#ff8a8a;grid-column:1/-1;text-align:center;">Error: ' + err.message + '</p>';
  });