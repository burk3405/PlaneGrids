// filepath: c:\Users\acbur\Desktop\PlaneGrids.com\gameLoader.js
document.addEventListener('DOMContentLoaded', function () {
  const params = new URLSearchParams(window.location.search);
  let prevNum = parseInt(params.get('prev'), 10);
  if (!prevNum || isNaN(prevNum) || prevNum < 1 || prevNum > 4) {
    prevNum = 0;
  }
  const script = document.createElement('script');
  script.src = prevNum === 0 ? 'day1.js' : `day${prevNum + 1}.js`;
  script.onload = () => console.log('Loaded:', script.src);
  script.onerror = () => console.error('Failed to load:', script.src);
  document.body.appendChild(script);

  // Button logic (ensure buttons exist before this runs)
  const prevBtn = document.getElementById('previous');
  const nextBtn = document.getElementById('next');
  if (prevBtn) {
    prevBtn.onclick = function() {
      if (prevNum < 4) {
        window.location.search = '?prev=' + (prevNum + 1);
      } else {
        alert('No more previous games!');
      }
    };
  }
  if (nextBtn) {
    if (prevNum === 0) {
      // Hide the Next button if on the latest game
      nextBtn.style.display = 'none';
    } else {
      nextBtn.onclick = function() {
        if (prevNum > 1) {
          window.location.search = '?prev=' + (prevNum - 1);
        } else if (prevNum === 1) {
          window.location.search = '';
        }
      };
    }
  }
});