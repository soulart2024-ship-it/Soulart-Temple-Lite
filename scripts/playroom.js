document.addEventListener('DOMContentLoaded', function() {
  checkMemberAccess();
});

async function checkMemberAccess() {
  const gamesGrid = document.getElementById('games-grid');
  const accessGate = document.getElementById('access-gate');
  
  try {
    const response = await fetch('/api/auth/check');
    const data = await response.json();
    
    if (data.authenticated) {
      gamesGrid.classList.remove('locked');
      accessGate.style.display = 'none';
    } else {
      gamesGrid.classList.add('locked');
      accessGate.style.display = 'block';
    }
  } catch (error) {
    gamesGrid.classList.add('locked');
    accessGate.style.display = 'block';
  }
}
