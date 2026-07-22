(function(){
  var stored = localStorage.getItem('theme');
  if(stored === 'dark' || stored === 'light'){
    document.documentElement.setAttribute('data-theme', stored);
  }
})();

document.addEventListener('DOMContentLoaded', function(){
  var btn = document.getElementById('themeToggle');
  if(!btn) return;

  function currentTheme(){
    var attr = document.documentElement.getAttribute('data-theme');
    if(attr) return attr;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function updateIcon(){
    btn.textContent = currentTheme() === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  updateIcon();
  btn.addEventListener('click', function(){
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateIcon();
  });
});
