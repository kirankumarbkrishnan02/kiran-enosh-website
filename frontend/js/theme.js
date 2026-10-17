/* KIRAN ENOSH — THEME TOGGLE */
function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById('themeToggle');
  
  // Toggle the class
  body.classList.toggle('light-mode');
  
  // Change the icon based on the mode
  if (body.classList.contains('light-mode')) {
    btn.innerHTML = '☀️'; // Sun icon for light mode
    localStorage.setItem('theme', 'light');
  } else {
    btn.innerHTML = '🌙'; // Moon icon for dark mode
    localStorage.setItem('theme', 'dark');
  }
}

// Check saved preference when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  const btn = document.getElementById('themeToggle');
  
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    if (btn) btn.innerHTML = '☀️';
  } else {
    if (btn) btn.innerHTML = '🌙';
  }
});