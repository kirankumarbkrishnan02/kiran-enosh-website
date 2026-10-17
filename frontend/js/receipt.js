/* ============================================================
   KIRAN ENOSH — RECEIPT.JS
   ============================================================ */

const API = 'https://kiran-enosh-backend.onrender.com/api/admin';

async function loadReceipt() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    alert('No receipt ID. Redirecting...');
    window.location.href = 'dashboard.html';
    return;
  }

  try {
    const res = await fetch(`${API}/payments/${id}`, { credentials: 'include' });
    if (!res.ok) {
      alert('Receipt not found.');
      window.location.href = 'dashboard.html';
      return;
    }

    const { payment } = await res.json();

    document.getElementById('receiptNumber').textContent = payment.receipt_number;
    document.getElementById('receiptDate').textContent = new Date(payment.paid_at).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    document.getElementById('studentName').textContent = payment.user_name;
    document.getElementById('studentEmail').textContent = payment.user_email;
    document.getElementById('studentPhone').textContent = payment.user_phone;
    document.getElementById('courseName').textContent = payment.course_name;
    document.getElementById('paymentMethod').textContent = payment.payment_method;
    document.getElementById('paymentType').textContent =
      payment.payment_type === 'deposit' ? 'Registration Deposit' : payment.payment_type;
    document.getElementById('amountPaid').textContent = `₹${payment.amount.toLocaleString('en-IN')}`;
  } catch (err) {
    console.error('Receipt error:', err);
    alert('Cannot reach server.');
    window.location.href = 'dashboard.html';
  }
}

loadReceipt();
console.log('🧾 Receipt page loaded');