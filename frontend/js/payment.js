/* ============================================================
   KIRAN ENOSH — PAYMENT.JS (Installment Version)
   ============================================================ */

const API = 'http://localhost:5000/api/admin';
const API_AUTH = 'http://localhost:5000/api/auth';

let courseTitle = '';
let coursePrice = 0;
let selectedMethod = 'UPI';
let selectedPlan = 'full'; // 'full' or 'installment'
let installmentMonths = 1;

// Read course from URL
async function init() {
  const params = new URLSearchParams(window.location.search);
  courseTitle = params.get('course') || '';
  coursePrice = parseInt(params.get('price') || '0');

  if (!courseTitle || !coursePrice) {
    showAlert('No valid course selected. Please go back to courses.', 'error');
    document.getElementById('paidBtn').disabled = true;
    return;
  }

  // Verify login
  const meRes = await fetch(`${API_AUTH}/me`, { credentials: 'include' });
  if (!meRes.ok) {
    window.location.href = 'login.html';
    return;
  }

  // Fill in course info
  document.getElementById('courseTitle').textContent = courseTitle;
  document.getElementById('courseTotal').textContent = `₹${coursePrice.toLocaleString('en-IN')}`;

  // Generate Installment Options
  generateInstallmentOptions();
}

function generateInstallmentOptions() {
  const container = document.getElementById('installmentOptions');
  container.innerHTML = '';

  // Option 1: Pay in Full (after course, so keep deposit now)
  const fullAmount = coursePrice - 10;
  const fullOpt = document.createElement('div');
  fullOpt.className = 'inst-option active';
  fullOpt.innerHTML = `
    <h4>Pay in Full</h4>
    <p>₹${fullAmount.toLocaleString('en-IN')} after completion</p>
  `;
  fullOpt.onclick = () => {
    document.querySelectorAll('.inst-option').forEach(el => el.classList.remove('active'));
    fullOpt.classList.add('active');
    selectedPlan = 'full';
    installmentMonths = 1;
  };
  container.appendChild(fullOpt);

  // Only show installment options if course is > 5000 (arbitrary threshold)
  if (coursePrice >= 5000) {
    // Option 2: 3 Months
    const threeMonth = Math.ceil((coursePrice - 10) / 3);
    const opt3 = document.createElement('div');
    opt3.className = 'inst-option';
    opt3.innerHTML = `
      <h4>3 Months</h4>
      <p>₹${threeMonth.toLocaleString('en-IN')} / month</p>
    `;
    opt3.onclick = () => {
      document.querySelectorAll('.inst-option').forEach(el => el.classList.remove('active'));
      opt3.classList.add('active');
      selectedPlan = 'installment';
      installmentMonths = 3;
    };
    container.appendChild(opt3);

    // Option 3: 6 Months
    const sixMonth = Math.ceil((coursePrice - 10) / 6);
    const opt6 = document.createElement('div');
    opt6.className = 'inst-option';
    opt6.innerHTML = `
      <h4>6 Months</h4>
      <p>₹${sixMonth.toLocaleString('en-IN')} / month</p>
    `;
    opt6.onclick = () => {
      document.querySelectorAll('.inst-option').forEach(el => el.classList.remove('active'));
      opt6.classList.add('active');
      selectedPlan = 'installment';
      installmentMonths = 6;
    };
    container.appendChild(opt6);
  }
}

// Tab switching
document.querySelectorAll('.pay-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pay-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.pay-content').forEach((c) => c.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.getAttribute('data-tab');
    document.getElementById(`tab-${target}`).classList.add('active');

    selectedMethod = target === 'upi' ? 'UPI' : target === 'netbanking' ? 'Net Banking' : 'Debit Card';
  });
});

// Confirm Payment
document.getElementById('paidBtn').addEventListener('click', async () => {
  const confirmed = confirm(
    `Please confirm you have paid the ₹10 deposit via ${selectedMethod}.\n\n` +
    `Plan: ${selectedPlan === 'full' ? 'Pay in Full' : installmentMonths + ' Installments'}\n\n` +
    `Click OK to confirm your registration.`
  );
  if (!confirmed) return;

  const btn = document.getElementById('paidBtn');
  btn.disabled = true;
  btn.textContent = 'Confirming...';

  try {
    // Create the payment record (Just the deposit)
    const res = await fetch(`${API}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        course_name: courseTitle,
        amount: 10,
        payment_method: selectedMethod,
        payment_type: 'deposit',
        // Pass installment info to backend so we can save it
        payment_plan: selectedPlan,
        installment_months: installmentMonths
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      btn.disabled = false;
      btn.textContent = '✓ I Have Paid ₹10 — Confirm Registration';
      return showAlert('❌ ' + (data.error || 'Payment failed. Try again.'), 'error');
    }

    showAlert('✅ Payment confirmed! Generating receipt...', 'success');
    setTimeout(() => {
      window.location.href = `receipt.html?id=${data.payment.id}`;
    }, 900);
  } catch (err) {
    console.error('Payment error:', err);
    btn.disabled = false;
    btn.textContent = '✓ I Have Paid ₹10 — Confirm Registration';
    showAlert('Cannot reach server. Please try again.', 'error');
  }
});

function showAlert(text, type) {
  const box = document.getElementById('alertBox');
  box.textContent = text;
  box.className = 'alert-box ' + type;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

init();
console.log('💳 Payment page loaded');