(function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light-mode');
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('light-mode');
            const checkbox = document.getElementById('themeCheckbox');
            if(checkbox) checkbox.checked = true;
        });
    }
})();

function toggleTheme() {
    const checkbox = document.getElementById('themeCheckbox');
    const isLight = checkbox.checked;
    
    if (isLight) {
        document.documentElement.classList.add('light-mode');
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.remove('light-mode');
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    }
}