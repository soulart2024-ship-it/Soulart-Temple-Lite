// Emotion information data structure
const emotionInfo = {
  fear: {
    definition: "Fear is the anticipation of danger or harm, whether real or imagined. When trapped, it creates a persistent state of alertness that drains your energy and narrows your perception of possibilities.",
    symptoms: "Physical tension, racing heart, shallow breathing, difficulty making decisions, avoiding new experiences, feeling frozen or paralyzed in certain situations.",
    scenario: "You may find yourself avoiding opportunities for growth, staying in situations that no longer serve you, or feeling anxious about stepping into your authentic power.",
    healingTruth: "You are safe to explore, grow, and trust in your own resilience. Your courage is greater than your fear."
  },
  guilt: {
    definition: "Guilt arises when we believe we've done something wrong or failed to meet our own or others' expectations. Trapped guilt keeps us stuck in the past, replaying scenarios we cannot change.",
    symptoms: "Self-criticism, difficulty accepting compliments, over-apologizing, feeling undeserving of happiness, chronic regret, tension in the chest or stomach.",
    scenario: "You might constantly second-guess your decisions, feel responsible for others' emotions, or struggle to forgive yourself for past actions.",
    healingTruth: "You deserve forgiveness and compassion. Every experience has taught you something valuable, and you are worthy of peace."
  },
  shame: {
    definition: "Shame is the belief that we are fundamentally flawed or unworthy. Unlike guilt (I did something bad), shame says 'I am bad.' This deep wound affects our sense of belonging and self-worth.",
    symptoms: "Feeling exposed or vulnerable, hiding parts of yourself, perfectionism, difficulty receiving love, social withdrawal, sensation of heaviness or darkness.",
    scenario: "You may hide your true feelings, downplay your achievements, or feel like an imposter even in your successes.",
    healingTruth: "You are inherently worthy. Your essence is beautiful and deserving of love exactly as you are."
  },
  grief: {
    definition: "Grief is the natural response to loss—of people, dreams, identities, or possibilities. When trapped, it creates a heaviness that colors your entire experience of life.",
    symptoms: "Heaviness in the heart, difficulty feeling joy, lingering sadness, fatigue, sense of emptiness, resistance to new connections or experiences.",
    scenario: "You might find it hard to fully embrace new relationships or opportunities, feeling tethered to what once was or might have been.",
    healingTruth: "Your capacity to grieve reflects your capacity to love. Honoring your loss opens space for new growth and connection."
  },
  anger: {
    definition: "Anger signals that a boundary has been crossed or a need hasn't been met. When trapped, it can simmer beneath the surface, affecting health and relationships, or explode in disproportionate ways.",
    symptoms: "Jaw tension, headaches, irritability, resentment, physical heat, clenched fists, difficulty relaxing, passive-aggressive behavior.",
    scenario: "You might find yourself reacting strongly to minor frustrations, holding grudges, or feeling a constant simmering annoyance with people or situations.",
    healingTruth: "Your anger holds important information about your needs and boundaries. When acknowledged and expressed healthily, it becomes a catalyst for positive change."
  },
  despair: {
    definition: "Despair is the loss of hope, a deep sense that nothing will improve or that meaning is absent from life. It's a profound disconnect from possibility and purpose.",
    symptoms: "Apathy, loss of motivation, feeling of emptiness, difficulty seeing a positive future, withdrawal from activities once enjoyed, numbness.",
    scenario: "You might go through the motions of daily life while feeling disconnected from meaning, struggling to see the point of your efforts.",
    healingTruth: "Even in darkness, seeds of hope remain. Small steps reconnect you with meaning, and your life has purpose beyond what you can currently see."
  },
  abandonment: {
    definition: "The fear or experience of being left alone, unsupported, or uncared for. Trapped abandonment creates patterns of clinging or pre-emptive distancing in relationships.",
    symptoms: "Anxiety in relationships, fear of being alone, difficulty trusting others' commitment, testing behaviors, rushing into or avoiding intimacy.",
    scenario: "You might struggle with intense relationship anxiety, constantly seeking reassurance, or alternatively, keeping people at arm's length to avoid potential pain.",
    healingTruth: "You are never truly alone. You are worthy of consistent love and presence, starting with your own."
  },
  rejection: {
    definition: "The pain of feeling unwanted, excluded, or not chosen. Trapped rejection shapes how we show up in the world, often leading us to reject ourselves before others can.",
    symptoms: "Fear of being authentic, people-pleasing, difficulty expressing needs, sensitivity to criticism, social anxiety, feeling like an outsider.",
    scenario: "You might dim your light to fit in, avoid sharing your ideas, or interpret neutral situations as personal rejection.",
    healingTruth: "Being truly seen and celebrated for who you are is your birthright. The right people will cherish your authentic self."
  },
  hopelessness: {
    definition: "A belief that positive change is impossible, creating a sense of being trapped or powerless to improve one's circumstances.",
    symptoms: "Pessimism, difficulty envisioning a better future, lack of motivation to try new approaches, fatigue, resignation.",
    scenario: "You might find yourself thinking 'what's the point?' or believing that effort won't lead to improvement in your situation.",
    healingTruth: "Hope is a practice, not a feeling. Small actions, taken consistently, create change beyond what your current perspective can imagine."
  },
  powerlessness: {
    definition: "The belief that you have no control or influence over your life circumstances, leading to passivity and victim mentality.",
    symptoms: "Indecisiveness, difficulty taking action, waiting for others to solve problems, feeling overwhelmed by small tasks, chronic procrastination.",
    scenario: "You might regularly say 'I can't' or 'I have to,' feeling controlled by external circumstances rather than recognizing your agency.",
    healingTruth: "You have more power than you realize. Even small choices reconnect you with your inherent agency and strength."
  },
  anxiety: {
    definition: "Persistent worry and activation of the stress response, often focused on uncertain future events. Trapped anxiety keeps the nervous system in a state of constant alert.",
    symptoms: "Racing thoughts, restlessness, difficulty concentrating, sleep disturbances, muscle tension, feeling 'wired,' catastrophic thinking.",
    scenario: "You might create elaborate worst-case scenarios, struggle to be present in the moment, or feel your mind constantly jumping to 'what if?'",
    healingTruth: "Your anxiety is trying to protect you, but you are safe to be present. Peace exists in this moment, right now."
  },
  worthlessness: {
    definition: "A deep belief that you lack value or that your existence doesn't matter. This fundamental wound affects every aspect of self-perception and life choices.",
    symptoms: "Chronic self-criticism, difficulty receiving compliments, settling for less than you deserve, feeling invisible, comparing yourself unfavorably to others.",
    scenario: "You might downplay your accomplishments, feel like a burden to others, or struggle to advocate for your own needs.",
    healingTruth: "Your worth is inherent and unchangeable. You matter simply because you exist, and your unique presence enriches the world."
  }
};

// Modal functionality
const modal = document.getElementById('emotion-modal');
const modalName = document.getElementById('modal-emotion-name');
const modalContent = document.getElementById('modal-emotion-content');
const closeBtn = document.querySelector('.close-modal');

// Initialize emotion tiles
document.addEventListener('DOMContentLoaded', function() {
  const emotionTiles = document.querySelectorAll('.emotion-tile');
  
  emotionTiles.forEach(tile => {
    tile.addEventListener('click', function() {
      const emotion = this.getAttribute('data-emotion');
      openModal(emotion);
    });
    
    // Keyboard accessibility
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', '0');
    tile.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const emotion = this.getAttribute('data-emotion');
        openModal(emotion);
      }
    });
  });
});

// Open modal with emotion info
function openModal(emotion) {
  const info = emotionInfo[emotion];
  if (!info) return;
  
  const emotionName = emotion.charAt(0).toUpperCase() + emotion.slice(1);
  modalName.textContent = emotionName;
  
  modalContent.innerHTML = `
    <p><strong>${info.definition}</strong></p>
    
    <h4>Common Signs & Symptoms:</h4>
    <p>${info.symptoms}</p>
    
    <h4>Example Life Scenario:</h4>
    <p>${info.scenario}</p>
    
    <div class="healing-truth">
      <h4>Healing Truth:</h4>
      <p>${info.healingTruth}</p>
    </div>
  `;
  
  modal.style.display = 'block';
  
  // Focus trap - focus on close button
  closeBtn.focus();
}

// Close modal
closeBtn.addEventListener('click', closeModal);

// Close on outside click
window.addEventListener('click', function(e) {
  if (e.target === modal) {
    closeModal();
  }
});

// Close on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && modal.style.display === 'block') {
    closeModal();
  }
});

function closeModal() {
  modal.style.display = 'none';
}
