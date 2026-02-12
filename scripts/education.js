// Education Centre JavaScript

document.addEventListener('DOMContentLoaded', function() {
  console.log('Education Centre loaded successfully');
  
  // Emotion data for the 12 Core Trapped Emotions
  const emotionData = {
    fear: {
      title: 'Fear',
      description: 'Fear is one of the most primal emotions, designed to protect us from danger. However, when fear becomes trapped, it can create ongoing anxiety, phobias, and avoidance patterns that limit our lives.',
      effects: [
        'Chronic anxiety or worry',
        'Avoidance of new experiences',
        'Physical tension in the body',
        'Difficulty trusting others',
        'Feeling stuck or paralyzed when making decisions'
      ],
      healing: 'Releasing trapped fear allows you to move forward with confidence and trust in life\'s journey.'
    },
    guilt: {
      title: 'Guilt',
      description: 'Guilt arises when we believe we have done something wrong or failed to meet our own standards. Trapped guilt can lead to self-punishment and prevent us from accepting love and forgiveness.',
      effects: [
        'Constant self-criticism',
        'Difficulty accepting compliments or help',
        'Tendency to over-apologize',
        'Feeling undeserving of good things',
        'Sabotaging personal success or happiness'
      ],
      healing: 'Releasing trapped guilt opens the door to self-forgiveness and genuine self-acceptance.'
    },
    shame: {
      title: 'Shame',
      description: 'While guilt says "I did something bad," shame says "I am bad." This deeply painful emotion can become trapped when we internalize criticism or experience humiliation.',
      effects: [
        'Low self-worth and self-esteem',
        'Hiding your true self from others',
        'Perfectionism as a coping mechanism',
        'Difficulty with vulnerability',
        'Social withdrawal or isolation'
      ],
      healing: 'Releasing trapped shame reveals your inherent worthiness and allows authentic self-expression.'
    },
    grief: {
      title: 'Grief',
      description: 'Grief is a natural response to loss—whether of a person, relationship, dream, or phase of life. When grief cannot be fully processed, it becomes trapped and weighs heavily on the heart.',
      effects: [
        'Persistent sadness or melancholy',
        'Difficulty moving forward after loss',
        'Emotional numbness or flatness',
        'Physical heaviness, especially in the chest',
        'Difficulty experiencing joy'
      ],
      healing: 'Releasing trapped grief allows the heart to heal and opens space for new love and joy.'
    },
    anger: {
      title: 'Anger',
      description: 'Anger is a powerful emotion that signals when our boundaries have been crossed or we feel threatened. Trapped anger can simmer beneath the surface, affecting our health and relationships.',
      effects: [
        'Irritability and short temper',
        'Passive-aggressive behavior',
        'Physical tension, especially in jaw and shoulders',
        'Difficulty with patience and tolerance',
        'Explosive outbursts or rage'
      ],
      healing: 'Releasing trapped anger restores inner peace and allows for healthy boundary-setting.'
    },
    despair: {
      title: 'Despair',
      description: 'Despair is a deep sense of hopelessness that occurs when we feel completely overwhelmed by life circumstances. This heavy emotion can become trapped during times of profound difficulty.',
      effects: [
        'Feeling that nothing will ever improve',
        'Loss of motivation and drive',
        'Difficulty seeing positive possibilities',
        'Emotional heaviness and fatigue',
        'Disconnection from purpose and meaning'
      ],
      healing: 'Releasing trapped despair rekindlies hope and reconnects you with life\'s possibilities.'
    },
    abandonment: {
      title: 'Abandonment',
      description: 'The fear or experience of being left behind creates deep emotional wounds. Trapped abandonment energy can affect our ability to form secure attachments.',
      effects: [
        'Fear of being left or rejected',
        'Clinginess or excessive need for reassurance',
        'Pushing people away before they can leave',
        'Difficulty trusting in relationships',
        'Anxiety when separated from loved ones'
      ],
      healing: 'Releasing trapped abandonment creates inner security and healthier relationships.'
    },
    rejection: {
      title: 'Rejection',
      description: 'Rejection wounds occur when we feel unwanted, excluded, or not good enough. This painful emotion can become trapped and create patterns of self-rejection.',
      effects: [
        'Fear of putting yourself out there',
        'Sensitivity to criticism',
        'People-pleasing behaviors',
        'Difficulty accepting yourself',
        'Avoiding situations where rejection is possible'
      ],
      healing: 'Releasing trapped rejection restores self-acceptance and courage to be authentically you.'
    },
    hopelessness: {
      title: 'Hopelessness',
      description: 'Hopelessness occurs when we lose faith that things can improve or that our efforts matter. This emotion can become trapped during prolonged difficult circumstances.',
      effects: [
        'Giving up on goals and dreams',
        'Difficulty imagining a positive future',
        'Lack of motivation to try',
        'Feeling that efforts are pointless',
        'Resignation to negative circumstances'
      ],
      healing: 'Releasing trapped hopelessness restores faith in yourself and life\'s possibilities.'
    },
    powerlessness: {
      title: 'Powerlessness',
      description: 'Powerlessness is the feeling of having no control or influence over your circumstances. This emotion can become trapped during times when we truly had no power.',
      effects: [
        'Feeling like a victim of circumstances',
        'Difficulty making decisions',
        'Letting others control your life',
        'Lack of confidence in your abilities',
        'Avoiding taking action or initiative'
      ],
      healing: 'Releasing trapped powerlessness reconnects you with your inner strength and personal power.'
    },
    anxiety: {
      title: 'Anxiety',
      description: 'Anxiety is a state of persistent worry about future events or outcomes. When this becomes trapped, it can create chronic tension and ongoing unease.',
      effects: [
        'Constant worry about the future',
        'Physical symptoms like racing heart, tension',
        'Difficulty relaxing or being present',
        'Overthinking and rumination',
        'Sleep disturbances and restlessness'
      ],
      healing: 'Releasing trapped anxiety creates inner calm and the ability to be present in the moment.'
    },
    worthlessness: {
      title: 'Worthlessness',
      description: 'Worthlessness is the painful belief that you have no value or importance. This deeply wounding emotion can become trapped through criticism, neglect, or comparison.',
      effects: [
        'Feeling like you don\'t matter',
        'Difficulty accepting love or care',
        'Undervaluing your contributions',
        'Putting everyone else\'s needs first',
        'Not pursuing your dreams or desires'
      ],
      healing: 'Releasing trapped worthlessness reveals your infinite inherent value and worth.'
    }
  };
  
  // Add click handlers to emotion tiles
  const emotionTiles = document.querySelectorAll('.emotion-tile');
  
  emotionTiles.forEach(tile => {
    tile.addEventListener('click', function() {
      const emotionKey = this.dataset.emotion;
      const emotion = emotionData[emotionKey];
      
      if (emotion) {
        showEmotionModal(emotion);
      }
    });
  });
  
  function showEmotionModal(emotion) {
    // Create modal HTML
    const effectsList = emotion.effects.map(effect => `<li>${effect}</li>`).join('');
    
    const modalHTML = `
      <div class="emotion-modal" id="emotion-modal">
        <div class="emotion-modal-content">
          <button class="emotion-modal-close" onclick="closeEmotionModal()">&times;</button>
          <h2>${emotion.title}</h2>
          <p>${emotion.description}</p>
          <h3>Common Effects of Trapped ${emotion.title}:</h3>
          <ul>${effectsList}</ul>
          <h3>Healing Message:</h3>
          <p><em>${emotion.healing}</em></p>
        </div>
      </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    // Add click outside to close
    const modal = document.getElementById('emotion-modal');
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeEmotionModal();
      }
    });
    
    // Add escape key to close
    document.addEventListener('keydown', handleEscapeKey);
  }
  
  function handleEscapeKey(e) {
    if (e.key === 'Escape') {
      closeEmotionModal();
    }
  }
  
  // Make closeEmotionModal global so onclick can access it
  window.closeEmotionModal = function() {
    const modal = document.getElementById('emotion-modal');
    if (modal) {
      modal.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscapeKey);
    }
  };
});
