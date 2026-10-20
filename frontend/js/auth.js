/* ============================================================
   KIRAN ENOSH — AUTH.JS (with role-based redirect & forgot password)
   ============================================================ */

const API_BASE = '/api/auth';

function showMessage(text, type) {
  const box = document.getElementById('messageBox');
  if (!box) return;
  box.textContent = text;
  box.className = 'auth-message ' + (type || 'error');
}

function clearMessage() {
  const box = document.getElementById('messageBox');
  if (box) box.className = 'auth-message';
}

function setSubmitting(isSubmitting) {
  const btn = document.getElementById('submitBtn');
  if (!btn) return;
  btn.disabled = isSubmitting;
  btn.textContent = isSubmitting ? 'Please wait...' : btn.dataset.originalText || 'Submit';
}

function validatePassword(password) {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`';]/.test(password)) return 'Password must include at least one symbol (!@#$%^&* etc.).';
  return null;
}

/* Redirect based on role */
function redirectAfterAuth(user) {
  const url = user && user.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
  window.location.href = url;
}


/* ---------- REGISTER FORM ---------- */
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.dataset.originalText = submitBtn.textContent;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();

    // Get all fields
    const name = document.getElementById('name').value.trim();
    const father_name = document.getElementById('father_name').value.trim();
    const mother_name = document.getElementById('mother_name').value.trim();
    const gender = document.getElementById('gender').value;
    const dob = document.getElementById('dob').value;
    const last_education = document.getElementById('last_education').value.trim();
    const address = document.getElementById('address').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;

    // Basic validation
    if (!name || !email || !phone || !password || !father_name || !mother_name || !gender || !dob || !last_education || !address) {
      return showMessage('Please fill in all required fields.');
    }

    const passwordError = validatePassword(password);
    if (passwordError) return showMessage(passwordError);

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          name, email, phone, password, 
          father_name, mother_name, gender, dob, last_education, address 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && data.errors.length) {
          return showMessage(data.errors[0].msg);
        }
        return showMessage(data.error || 'Registration failed. Please try again.');
      }

      showMessage('✅ Account created! Redirecting to dashboard...', 'success');
      setTimeout(() => (window.location.href = 'dashboard.html'), 900);
    } catch (err) {
      console.error('Register error:', err);
      showMessage('Cannot reach server. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  });
}
/* ============ LOGIN ============ */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.dataset.originalText = submitBtn.textContent;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) return showMessage('Please enter email and password.');

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) return showMessage(data.error || 'Invalid credentials.');

      showMessage('✅ Login successful! Redirecting...', 'success');
      setTimeout(() => redirectAfterAuth(data.user), 700);
    } catch (err) {
      console.error(err);
      showMessage('Cannot reach server. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  });
}

/* ============ FORGOT PASSWORD ============ */
const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.dataset.originalText = submitBtn.textContent;

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();

    const email = document.getElementById('email').value.trim();

    if (!email) return showMessage('Please enter your email address.');

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return showMessage(data.message || data.error || 'Could not send reset link.');
      }

      showMessage('✅ ' + data.message, 'success');
      // Optional: Clear the form after success
      document.getElementById('email').value = '';
    } catch (err) {
      console.error(err);
      showMessage('Cannot reach server. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  });
}

/* Password toggle (checkbox) */
function togglePwd(inputId, checkbox) {
  var input = document.getElementById(inputId);
  if (input) input.type = checkbox.checked ? 'text' : 'password';
}
window.togglePwd = togglePwd;

console.log(' Auth script loaded');