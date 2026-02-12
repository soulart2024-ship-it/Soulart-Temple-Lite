const SoulArtNavigation = {
  rooms: [
    { id: 'root', name: 'Root Chakra', path: 'root.html', color: '#8B0000' },
    { id: 'sacral', name: 'Sacral Chakra', path: 'sacral.html', color: '#FF6B00' },
    { id: 'solar', name: 'Solar Plexus', path: 'solar.html', color: '#FFD700' },
    { id: 'heart', name: 'Heart Chakra', path: 'heart.html', color: '#228B22' },
    { id: 'throat', name: 'Throat Chakra', path: 'throat.html', color: '#4169E1' },
    { id: 'third-eye', name: 'Third Eye', path: 'third-eye.html', color: '#6A0DAD' },
    { id: 'crown', name: 'Crown Chakra', path: 'crown.html', color: '#9400D3' }
  ],

  init() {
    this.setupTransitions();
    this.highlightCurrentRoom();
  },

  getCurrentRoom() {
    const path = window.location.pathname;
    const fileName = path.split('/').pop();
    return this.rooms.find(room => room.path === fileName);
  },

  highlightCurrentRoom() {
    const currentRoom = this.getCurrentRoom();
    if (currentRoom) {
      document.body.setAttribute('data-current-room', currentRoom.id);
    }
  },

  setupTransitions() {
    document.querySelectorAll('a').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.endsWith('.html') || href.startsWith('tools/'))) {
        link.addEventListener('click', (e) => {
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.navigateTo(href);
          }
        });
      }
    });
  },

  navigateTo(url) {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
      window.location.href = url;
    }, 300);
  },

  getNextRoom() {
    const current = this.getCurrentRoom();
    if (!current) return this.rooms[0];
    const index = this.rooms.findIndex(r => r.id === current.id);
    return this.rooms[(index + 1) % this.rooms.length];
  },

  getPrevRoom() {
    const current = this.getCurrentRoom();
    if (!current) return this.rooms[this.rooms.length - 1];
    const index = this.rooms.findIndex(r => r.id === current.id);
    return this.rooms[(index - 1 + this.rooms.length) % this.rooms.length];
  }
};

document.addEventListener('DOMContentLoaded', () => {
  SoulArtNavigation.init();
  
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.4s ease';
    document.body.style.opacity = '1';
  });
});

async function goToMembersArea(event) {
  event.preventDefault();
  event.stopPropagation();
  
  try {
    const response = await fetch('/api/auth/check');
    const data = await response.json();
    
    if (data.authenticated) {
      window.location.href = '/members-dashboard.html';
    } else {
      window.location.href = '/login.html';
    }
  } catch (error) {
    console.log('Auth check failed, redirecting to login');
    window.location.href = '/login.html';
  }
}
