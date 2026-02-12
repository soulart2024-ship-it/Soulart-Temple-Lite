document.addEventListener('DOMContentLoaded', function() {
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const btnText = sendBtn.querySelector('.btn-text');
  const btnLoading = sendBtn.querySelector('.btn-loading');
  const messageCountEl = document.getElementById('message-count');
  const suggestionChips = document.querySelectorAll('.suggestion-chip');
  
  let isLoading = false;
  
  async function checkUsage() {
    try {
      const response = await fetch('/api/guide/usage');
      const data = await response.json();
      
      if (data.can_send && data.has_premium) {
        messageCountEl.textContent = 'Unlimited (Premium)';
        enableChat();
      } else {
        messageCountEl.textContent = 'Premium Only';
        showPremiumRequired();
      }
      
      return data;
    } catch (e) {
      messageCountEl.textContent = '-';
      showPremiumRequired();
      return { can_send: false, has_premium: false };
    }
  }
  
  function enableChat() {
    userInput.disabled = false;
    sendBtn.disabled = false;
  }
  
  function showPremiumRequired() {
    const upgradeDiv = document.createElement('div');
    upgradeDiv.className = 'premium-required';
    upgradeDiv.innerHTML = `
      <div class="premium-notice">
        <h3>Premium Feature</h3>
        <p>The SoulArt AI Guide is available exclusively for Premium members.</p>
        <p>Upgrade to Premium for <strong>£6.99/month</strong> to unlock:</p>
        <ul>
          <li>Unlimited AI-guided emotional reflection</li>
          <li>Personalised journal prompts</li>
          <li>Gentle grounding suggestions</li>
          <li>Everything in Essential tier</li>
        </ul>
        <a href="membership.html" class="upgrade-btn">View Membership Options</a>
      </div>
    `;
    chatMessages.appendChild(upgradeDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    userInput.disabled = true;
    sendBtn.disabled = true;
  }
  
  function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + (isUser ? 'user-message' : 'guide-message');
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    if (isUser) {
      avatarDiv.innerHTML = '<div class="user-avatar">You</div>';
    } else {
      avatarDiv.innerHTML = '<img src="SoulArt Brand full.png" alt="SoulArt Guide" class="guide-avatar">';
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (typeof content === 'string') {
      contentDiv.innerHTML = content;
    } else {
      contentDiv.appendChild(content);
    }
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
  }
  
  function formatGuideResponse(data) {
    let html = '';
    
    if (data.reflection) {
      html += '<p>' + escapeHtml(data.reflection) + '</p>';
    }
    
    if (data.journal_prompts && data.journal_prompts.length > 0) {
      html += '<div class="journal-prompts">';
      html += '<h4>Journal Prompts for You</h4>';
      html += '<ul>';
      data.journal_prompts.forEach(prompt => {
        html += '<li>' + escapeHtml(prompt) + '</li>';
      });
      html += '</ul>';
      html += '</div>';
    }
    
    if (data.grounding_suggestion) {
      html += '<div class="grounding-suggestion">';
      html += '<strong>Grounding Suggestion:</strong> ' + escapeHtml(data.grounding_suggestion);
      html += '</div>';
    }
    
    return html;
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function showLimitReached() {
    const limitDiv = document.createElement('div');
    limitDiv.className = 'limit-reached';
    limitDiv.innerHTML = `
      <h3>Premium Required</h3>
      <p>The SoulArt AI Guide is available exclusively for Premium members (£6.99/month).</p>
      <a href="membership.html" class="upgrade-btn">Upgrade to Premium</a>
    `;
    chatMessages.appendChild(limitDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    userInput.disabled = true;
    sendBtn.disabled = true;
  }
  
  async function sendMessage(message) {
    if (isLoading || !message.trim()) return;
    
    isLoading = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    sendBtn.disabled = true;
    userInput.disabled = true;
    
    addMessage('<p>' + escapeHtml(message) + '</p>', true);
    userInput.value = '';
    
    try {
      const response = await fetch('/api/guide/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message })
      });
      
      const data = await response.json();
      
      if (response.status === 429) {
        showLimitReached();
        return;
      }
      
      if (data.error) {
        addMessage('<p>I apologize, but I encountered a moment of reflection. Please try again.</p>');
      } else {
        addMessage(formatGuideResponse(data));
      }
      
      await checkUsage();
      
    } catch (error) {
      console.error('Error:', error);
      addMessage('<p>I apologize, but I encountered a moment of pause. Please try sharing again.</p>');
    } finally {
      isLoading = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      sendBtn.disabled = false;
      userInput.disabled = false;
      userInput.focus();
    }
  }
  
  chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    sendMessage(userInput.value);
  });
  
  userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(userInput.value);
    }
  });
  
  suggestionChips.forEach(chip => {
    chip.addEventListener('click', function() {
      const prompt = this.dataset.prompt;
      userInput.value = prompt;
      sendMessage(prompt);
    });
  });
  
  checkUsage();
});
