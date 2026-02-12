const SoulArtGuidePopup = {
  isOpen: false,
  messages: [],
  roomContext: null,
  
  roomPrompts: {
    'root': {
      name: 'Root Chakra',
      prompts: [
        "I'm feeling unsafe or unstable",
        "Help me ground myself",
        "I need support with feeling secure"
      ]
    },
    'sacral': {
      name: 'Sacral Chakra',
      prompts: [
        "I'm struggling to express creativity",
        "Help me connect with my emotions",
        "I feel blocked in my flow"
      ]
    },
    'solar': {
      name: 'Solar Plexus',
      prompts: [
        "I need help with confidence",
        "I feel powerless right now",
        "Guide me to reclaim my strength"
      ]
    },
    'heart': {
      name: 'Heart Chakra',
      prompts: [
        "I'm having trouble with forgiveness",
        "Help me open my heart",
        "I need support processing grief"
      ]
    },
    'throat': {
      name: 'Throat Chakra',
      prompts: [
        "I'm afraid to speak my truth",
        "Help me express myself clearly",
        "I feel unheard"
      ]
    },
    'third-eye': {
      name: 'Third Eye',
      prompts: [
        "I need clarity on a decision",
        "Help me trust my intuition",
        "I'm seeking deeper understanding"
      ]
    },
    'crown': {
      name: 'Crown Chakra',
      prompts: [
        "I feel disconnected spiritually",
        "Help me find stillness",
        "Guide me to inner peace"
      ]
    }
  },

  init() {
    this.detectRoom();
    this.createPopupHTML();
    this.attachEventListeners();
  },

  detectRoom() {
    const path = window.location.pathname;
    const fileName = path.split('/').pop().replace('.html', '');
    if (this.roomPrompts[fileName]) {
      this.roomContext = fileName;
    }
  },

  createPopupHTML() {
    const popup = document.createElement('div');
    popup.id = 'guide-popup';
    popup.className = 'guide-popup';
    popup.innerHTML = `
      <div class="guide-popup-overlay" onclick="SoulArtGuidePopup.close()"></div>
      <div class="guide-popup-container">
        <div class="guide-popup-header">
          <div class="guide-popup-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
              <circle cx="7.5" cy="14.5" r="1.5"/>
              <circle cx="16.5" cy="14.5" r="1.5"/>
            </svg>
            <span>SoulArt Guide</span>
          </div>
          <button class="guide-popup-close" onclick="SoulArtGuidePopup.close()" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="guide-popup-messages" id="guide-popup-messages">
          <div class="guide-message">
            <p>Hello, beautiful soul. I'm here to offer gentle guidance. What's on your heart today?</p>
          </div>
        </div>
        
        <div class="guide-popup-prompts" id="guide-popup-prompts"></div>
        
        <div class="guide-popup-input">
          <textarea id="guide-popup-input" placeholder="Share what's on your heart..." rows="2"></textarea>
          <button id="guide-popup-send" onclick="SoulArtGuidePopup.sendMessage()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
        
        <div class="guide-popup-footer">
          <a href="${this.getGuidePath()}" class="guide-full-link">Open Full Guide Session</a>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    const styles = document.createElement('style');
    styles.textContent = `
      .guide-popup { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1000; }
      .guide-popup.open { display: block; }
      .guide-popup-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
      .guide-popup-container { position: absolute; bottom: 100px; right: 30px; width: 380px; max-width: calc(100vw - 40px); max-height: 70vh; background: #fff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); display: flex; flex-direction: column; overflow: hidden; animation: slideUp 0.3s ease; }
      @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .guide-popup-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: linear-gradient(135deg, #9400D3 0%, #6A0DAD 100%); color: #fff; }
      .guide-popup-title { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 1.1rem; }
      .guide-popup-title svg { width: 24px; height: 24px; }
      .guide-popup-close { background: none; border: none; color: #fff; cursor: pointer; padding: 4px; border-radius: 50%; transition: background 0.2s; }
      .guide-popup-close:hover { background: rgba(255,255,255,0.2); }
      .guide-popup-close svg { width: 20px; height: 20px; }
      .guide-popup-messages { flex: 1; overflow-y: auto; padding: 20px; max-height: 300px; }
      .guide-message { background: linear-gradient(135deg, #f8f4ff 0%, #f0e8ff 100%); padding: 14px 18px; border-radius: 16px; margin-bottom: 12px; font-size: 0.95rem; line-height: 1.6; color: #333; }
      .user-message { background: #1a1a2e; color: #fff; margin-left: 30px; }
      .guide-popup-prompts { padding: 0 20px 15px; display: flex; flex-wrap: wrap; gap: 8px; }
      .prompt-chip { background: #f0e8ff; border: 1px solid #d4c4f0; padding: 8px 14px; border-radius: 20px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; color: #6A0DAD; }
      .prompt-chip:hover { background: #6A0DAD; color: #fff; border-color: #6A0DAD; }
      .guide-popup-input { display: flex; gap: 10px; padding: 15px 20px; border-top: 1px solid #eee; }
      .guide-popup-input textarea { flex: 1; border: 1px solid #ddd; border-radius: 12px; padding: 10px 14px; font-size: 0.95rem; resize: none; font-family: inherit; }
      .guide-popup-input textarea:focus { outline: none; border-color: #9400D3; }
      .guide-popup-input button { width: 44px; height: 44px; border-radius: 50%; border: none; background: linear-gradient(135deg, #9400D3 0%, #6A0DAD 100%); color: #fff; cursor: pointer; transition: transform 0.2s; display: flex; align-items: center; justify-content: center; }
      .guide-popup-input button:hover { transform: scale(1.1); }
      .guide-popup-input button svg { width: 20px; height: 20px; }
      .guide-popup-footer { padding: 12px 20px; text-align: center; border-top: 1px solid #eee; }
      .guide-full-link { color: #6A0DAD; font-size: 0.9rem; text-decoration: none; font-weight: 500; }
      .guide-full-link:hover { text-decoration: underline; }
      .typing-indicator { display: flex; gap: 4px; padding: 14px 18px; }
      .typing-dot { width: 8px; height: 8px; background: #9400D3; border-radius: 50%; animation: typingBounce 1.4s infinite ease-in-out; }
      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typingBounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
      @media (max-width: 480px) {
        .guide-popup-container { bottom: 80px; right: 10px; width: calc(100vw - 20px); }
      }
    `;
    document.head.appendChild(styles);
  },

  getGuidePath() {
    const path = window.location.pathname;
    if (path.includes('/tools/')) {
      return 'guide.html';
    }
    return 'tools/guide.html';
  },

  attachEventListeners() {
    const existingBtn = document.querySelector('.guide-btn');
    if (existingBtn) {
      existingBtn.removeAttribute('onclick');
      existingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.open();
      });
    }

    document.getElementById('guide-popup-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.updatePrompts();
  },

  updatePrompts() {
    const container = document.getElementById('guide-popup-prompts');
    if (!container) return;

    const prompts = this.roomContext && this.roomPrompts[this.roomContext]
      ? this.roomPrompts[this.roomContext].prompts
      : ["I need some guidance", "Help me reflect", "I'm feeling uncertain"];

    container.innerHTML = prompts.map(p => 
      `<button class="prompt-chip" onclick="SoulArtGuidePopup.usePrompt('${p.replace(/'/g, "\\'")}')">${p}</button>`
    ).join('');
  },

  open() {
    document.getElementById('guide-popup').classList.add('open');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  },

  close() {
    document.getElementById('guide-popup').classList.remove('open');
    this.isOpen = false;
    document.body.style.overflow = '';
  },

  usePrompt(text) {
    document.getElementById('guide-popup-input').value = text;
    this.sendMessage();
  },

  async sendMessage() {
    const input = document.getElementById('guide-popup-input');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    this.addMessage(message, 'user');
    this.showTyping();

    try {
      const response = await fetch('/api/guide/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: message,
          context: this.roomContext ? `User is in the ${this.roomPrompts[this.roomContext]?.name || this.roomContext} room` : ''
        })
      });

      this.hideTyping();

      if (response.ok) {
        const data = await response.json();
        this.addMessage(data.response || data.message, 'guide');
      } else if (response.status === 403) {
        this.addMessage("The SoulArt Guide is available to Premium members. Would you like to explore our membership options?", 'guide');
      } else {
        this.addMessage("I'm having trouble connecting right now. Please try the full guide session.", 'guide');
      }
    } catch (err) {
      this.hideTyping();
      this.addMessage("Connection interrupted. Please try again or open the full guide.", 'guide');
    }

    document.getElementById('guide-popup-prompts').innerHTML = '';
  },

  addMessage(text, type) {
    const container = document.getElementById('guide-popup-messages');
    const div = document.createElement('div');
    div.className = type === 'user' ? 'guide-message user-message' : 'guide-message';
    div.innerHTML = `<p>${text}</p>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  showTyping() {
    const container = document.getElementById('guide-popup-messages');
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.id = 'typing-indicator';
    div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  hideTyping() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.guide-btn') || document.querySelector('.guide-float')) {
    SoulArtGuidePopup.init();
  }
});
