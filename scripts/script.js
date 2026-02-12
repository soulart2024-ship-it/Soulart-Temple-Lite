let decoderUsageChecked = false;
let canUseDecoder = true;
let decoderRemaining = 3;

async function checkDecoderUsage() {
  try {
    const response = await fetch('/api/decoder/usage');
    const data = await response.json();
    canUseDecoder = data.can_use;
    decoderRemaining = data.remaining;
    
    const indicator = document.getElementById('decoder-usage-indicator');
    if (indicator) {
      if (data.is_member) {
        indicator.textContent = 'Unlimited sessions (Member)';
        indicator.classList.add('member-status');
      } else if (data.is_total_limit) {
        indicator.textContent = `${decoderRemaining} free sessions remaining`;
        if (decoderRemaining === 0) {
          indicator.innerHTML = `<span class="upgrade-prompt">Free sessions used - <a href="membership.html">Upgrade for unlimited access</a></span>`;
        }
      } else {
        indicator.textContent = `${decoderRemaining} sessions remaining`;
      }
    }
    
    decoderUsageChecked = true;
    return data;
  } catch (e) {
    console.log('Could not check decoder usage');
    return { can_use: true, remaining: 3 };
  }
}

async function trackDecoderUse() {
  try {
    const response = await fetch('/api/decoder/track-use', { method: 'POST' });
    if (response.status === 429) {
      canUseDecoder = false;
      return;
    }
    await checkDecoderUsage();
  } catch (e) {
    console.log('Could not track decoder use');
  }
}

function showLimitModal() {
  const modal = document.getElementById('limit-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeLimitModal() {
  const modal = document.getElementById('limit-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  checkDecoderUsage();
  
  const limitModal = document.getElementById('limit-modal');
  if (limitModal) {
    limitModal.addEventListener('click', function(e) {
      if (e.target === limitModal) {
        closeLimitModal();
      }
    });
  }
});

async function startRelease(event, emotion) {
  if (!decoderUsageChecked) {
    await checkDecoderUsage();
  }
  
  if (!canUseDecoder) {
    showLimitModal();
    return;
  }
  
  await trackDecoderUse();
  
  if (!canUseDecoder) {
    showLimitModal();
    return;
  }

const chakraColors = {
  "Trust": "#B22222",
  "Forgiveness": "#FF914D",
  "Acceptance": "#FFD700",
  "Peace": "#8ED6B7",
  "Compassion": "#4FB2D6",
  "Hope": "#8F5AFF",
  "Grace": "#EAD3FF",
  "Worthiness": "#5B2C6F",
};

const frequencyPrompts = {
  "Trust": "When did you feel safest?",
  "Forgiveness": "When did you last feel forgiveness?",
  "Acceptance": "When did you last feel accepted?",
  "Peace": "How do you feel when you are connected to source?",
  "Compassion": "When did you most feel love?",
  "Hope": "When was your happiest moment?",
  "Grace": "When did you feel most at ease?",
  "Self-Worth": "When did you honor your value?",
  "Calm": "How do you feel when you are connected to source?",
  "Connection": "When did you most feel love?",
  "Understanding": "When did you last feel forgiveness?",
  "Confidence": "When did you feel most powerful?",
  "Empowerment": "When did you feel most powerful?",
  "Joy": "What was your most joyful moment in life?",
  "Belonging": "When did you most feel love?",
  "Worthiness": "When did you honor your value?",
  "Love": "When did you most feel love?",
  "Stability": "When did you feel most grounded and stable?",
  "Clarity": "When did you feel most clear and centered?",
  "Safety": "When did you feel completely safe?"
};

const releaseMap = {
  "Fear": {
    message: "I release fear and choose divine trust.",
    replacement: "Trust"
  },
  "Grief": {
    message: "I release grief and welcome peace.",
    replacement: "Peace"
  },
  "Anger": {
    message: "I release anger and embody compassion.",
    replacement: "Compassion"
  },
  "Shame": {
    message: "I release shame and reclaim my worth.",
    replacement: "Acceptance"
  },
  "Guilt": {
    message: "I release guilt and allow grace.",
    replacement: "Forgiveness"
  },
  "Despair": {
    message: "I release despair and awaken hope.",
    replacement: "Hope"
  },
  "Anxiety": {
    message: "I release anxiety and return to calm.",
    replacement: "Calm"
  },
  "Loneliness": {
    message: "I release loneliness and open to connection.",
    replacement: "Connection"
  },
  "Resentment": {
    message: "I release resentment and choose understanding.",
    replacement: "Understanding"
  },
  "Insecurity": {
    message: "I release insecurity and stand in my truth.",
    replacement: "Confidence"
  },
  "Helplessness": {
    message: "I release helplessness and activate power.",
    replacement: "Empowerment"
  },
  "Sadness": {
    message: "I release sadness and allow joy to rise.",
    replacement: "Joy"
  },
  "Abandonment": {
    message: "I release abandonment and embrace belonging.",
    replacement: "Belonging"
  },
  "Rejection": {
    message: "I release rejection and know I am loved.",
    replacement: "Acceptance"
  },
  "Hopelessness": {
    message: "I release hopelessness and welcome possibility.",
    replacement: "Hope"
  },
  "Powerlessness": {
    message: "I release powerlessness and claim my strength.",
    replacement: "Empowerment"
  },
  "Worthlessness": {
    message: "I release worthlessness and honor my value.",
    replacement: "Self-Worth"
  },
  "Hate": {
    message: "I release hate and choose love.",
    replacement: "Love"
  },
  "Insecurity": {
    message: "I release insecurity and stand in my truth.",
    replacement: "Stability"
  },
  "Resentment": {
    message: "I release resentment and choose understanding.",
    replacement: "Compassion"
  },
  "Helplessness": {
    message: "I release helplessness and activate power.",
    replacement: "Empowerment"
  },
  "Loneliness": {
    message: "I release loneliness and open to connection.",
    replacement: "Connection"
  },
  "Overwhelm": {
    message: "I release overwhelm and welcome clarity.",
    replacement: "Clarity"
  },
  "Disappointment": {
    message: "I release disappointment and restore trust.",
    replacement: "Trust"
  },
  "Betrayal": {
    message: "I release betrayal and reclaim safety.",
    replacement: "Safety"
  },
  "Unlovable": {
    message: "I release feeling unlovable and know my worth.",
    replacement: "Worthiness"
  }
};
   // Check if emotion exists in releaseMap
    if (!releaseMap[emotion]) {
      console.error(`Emotion "${emotion}" not found in releaseMap`);
      return;
    }
    
    const { message, replacement } = releaseMap[emotion];
    const replacementColor = chakraColors[replacement] || "#C8963E";
    const frequencyPrompt = frequencyPrompts[replacement] || "When did you feel this most powerfully?";
    
    // Remove 'selected' class from all buttons
    document.querySelectorAll('.emotion-grid button').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Add 'selected' class to clicked button
    event.target.classList.add('selected');
    
    const outputElement = document.getElementById('release-output');
    
    // Remove animation class to reset it
    outputElement.classList.remove('animate-in');
    
    // Force reflow to restart animation
    void outputElement.offsetWidth;
    
    // Set the content
    const output = `
      <h2>${emotion}</h2>
      <p><strong>Release Intention:</strong> I release ${emotion.toLowerCase()}.</p>
      <p><em>Swipe down the governing meridian 3x while holding the intention in your heart.</em></p>
      <div class="inline-video">
        <video controls playsinline>
          <source src="../videos/meridian-release.mp4" type="video/mp4">
          Your browser does not support video playback.
        </video>
      </div>
      
      <div class="recoding-section">
        <h3>Recoding After Release</h3>
        <p class="recoding-subtitle">Prompts to move you into a higher frequency</p>
        
        <div class="frequency-prompt">
          <p class="prompt-question">${frequencyPrompt}</p>
          <p class="prompt-instruction">Focus on this memory. Feel it in your body. Allow yourself to move into that vibration and frequency.</p>
        </div>
        
        <div class="meridian-swipe-instruction">
          <p><strong>Once you feel the vibration, swipe your meridian 3 times while saying:</strong></p>
          <p class="affirmation-text">"I am <span style="color:${replacementColor}; font-weight:bold;">${replacement}</span>"</p>
          <p class="education-link"><em>Need help with the swiping technique? <a href="education-centre.html">Visit our Education Centre</a> for video tutorials.</em></p>
        </div>
      </div>
      
      <button class="release-button" onclick="resetRelease()">Release Another Emotion</button>
    `;
    
    outputElement.innerHTML = output;
    
    // Add animation class to trigger fade-in
    outputElement.classList.add('animate-in');
    
    // Scroll to the output on mobile so users see the decoder action
    setTimeout(() => {
      outputElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

function resetRelease() {
  // Remove 'selected' class from all buttons
  document.querySelectorAll('.emotion-grid button').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // Clear the release output
  document.getElementById('release-output').innerHTML = '';
  
  // Scroll back to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleVideoGuide() {
  const videoGuide = document.getElementById('video-guide');
  const btn = document.querySelector('.video-toggle-btn');
  
  if (videoGuide.style.display === 'none') {
    videoGuide.style.display = 'block';
    btn.textContent = 'Hide Video Guide';
  } else {
    videoGuide.style.display = 'none';
    btn.textContent = 'Videos on How to Identify and Release';
  }
}

function toggleHiddenShadows() {
  const shadowsGrid = document.getElementById('hidden-shadows-grid');
  const btn = document.querySelector('.explore-shadows-btn');
  
  if (shadowsGrid.style.display === 'none') {
    shadowsGrid.style.display = 'grid';
    btn.textContent = 'Hide Hidden Shadows';
    shadowsGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    shadowsGrid.style.display = 'none';
    btn.textContent = 'Explore Hidden Shadows';
  }
}