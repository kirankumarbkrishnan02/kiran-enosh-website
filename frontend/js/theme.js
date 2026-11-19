// js/theme.js

// 1. Check for saved theme immediately to prevent flashing
if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light-mode');
}

// 2. Wait for the page to load, then apply to body
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
    }

    // 3. Find the toggle switch on the current page
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
    
    if (toggleSwitch) {
        // Set initial switch position based on saved theme
        if (localStorage.getItem('theme') === 'light') {
            toggleSwitch.checked = true;
        }

        // Add the click event listener
        toggleSwitch.addEventListener('change', function(e) {
            if (e.target.checked) {
                document.body.classList.add('light-mode');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.classList.remove('light-mode');
                localStorage.setItem('theme', 'dark');
            }
        });
    }
});