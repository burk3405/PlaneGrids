document.addEventListener('DOMContentLoaded', function () {
  const darkModeBtn = document.getElementById('dark-mode-btn');
  const darkModeIcon = document.getElementById('dark-mode-icon');
  // Always start in light mode unless user explicitly chose dark mode
  function updateIcon() {
    if (document.body.classList.contains('dark-mode-active')) {
      darkModeIcon.src = 'images/sun.png';
      darkModeIcon.alt = 'Switch to light mode';
      darkModeIcon.classList.add('inverted-icon');
    } else {
      darkModeIcon.src = 'images/moon.png';
      darkModeIcon.alt = 'Switch to dark mode';
      darkModeIcon.classList.remove('inverted-icon');
    }
  }
  function setDarkModeClass(isDark) {
    if (isDark) {
      document.body.classList.add('dark-mode-active');
      document.documentElement.classList.add('dark-mode-active'); // <html>
    } else {
      document.body.classList.remove('dark-mode-active');
      document.documentElement.classList.remove('dark-mode-active');
    }
  }
  if (localStorage.getItem('darkMode') === 'on') {
    setDarkModeClass(true);
  } else {
    setDarkModeClass(false);
    localStorage.setItem('darkMode', 'off');
  }
  updateIcon();
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', function () {
      const isDarkMode = !document.body.classList.contains('dark-mode-active');
      setDarkModeClass(isDarkMode);
      localStorage.setItem('darkMode', isDarkMode ? 'on' : 'off');
      updateIcon();
    });
  }
});