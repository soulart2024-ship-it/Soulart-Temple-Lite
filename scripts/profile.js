let journalEntriesLoaded = false;
let oracleReadingsLoaded = false;

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function toggleJournalEntries() {
  const section = document.getElementById('journal-entries-section');
  const isVisible = section.style.display !== 'none';
  
  if (isVisible) {
    section.style.display = 'none';
  } else {
    section.style.display = 'block';
    if (!journalEntriesLoaded) {
      await loadJournalEntries();
    }
  }
}

async function loadJournalEntries() {
  const container = document.getElementById('profile-journal-entries');
  
  try {
    const response = await fetch('/api/journal/entries');
    
    if (response.status === 401) {
      container.innerHTML = '<p class="error-msg">Please log in to view your entries.</p>';
      return;
    }
    
    const entries = await response.json();
    journalEntriesLoaded = true;
    
    if (entries.length === 0) {
      container.innerHTML = '<p class="no-entries">No journal entries yet. Visit the Sacred Journal to create your first entry.</p>';
      return;
    }
    
    container.innerHTML = entries.map(entry => `
      <div class="journal-entry-card">
        <div class="entry-card-header">
          <span class="entry-date">${formatDate(entry.created_at)}</span>
          <div class="entry-card-actions">
            <button onclick="downloadEntryPDF(${entry.id})" class="entry-action-btn">Download</button>
            <button onclick="uploadEntryToDrive(${entry.id})" class="entry-action-btn">Save to Drive</button>
            <button onclick="deleteJournalEntry(${entry.id})" class="entry-action-btn delete-btn">Delete</button>
          </div>
        </div>
        
        ${entry.doodle_image ? `
        <div class="entry-doodle-image">
          <img src="${entry.doodle_image}" alt="Art Meditation Artwork" class="doodle-artwork">
        </div>
        ` : ''}
        
        ${entry.affirmation ? `
        <div class="entry-affirmation">
          <strong>${entry.doodle_image ? 'Note:' : 'Affirmation:'}</strong> ${entry.affirmation}
        </div>
        ` : ''}
        
        ${entry.emotion_selected || entry.frequency_tag || entry.vibration_word ? `
        <div class="entry-tags">
          ${entry.emotion_selected ? `<span class="entry-tag">${entry.emotion_selected}</span>` : ''}
          ${entry.frequency_tag ? `<span class="entry-tag">${entry.frequency_tag}</span>` : ''}
          ${entry.vibration_word ? `<span class="entry-tag">${entry.vibration_word}</span>` : ''}
        </div>
        ` : ''}
        
        ${entry.prompt_used ? `
        <div class="entry-prompt">
          <em>Prompt: "${entry.prompt_used}"</em>
        </div>
        ` : ''}
        
        <div class="entry-content-preview">
          ${entry.general_reflection && !entry.doodle_image ? `<p><strong>Daily Reflection:</strong> ${entry.general_reflection.substring(0, 150)}${entry.general_reflection.length > 150 ? '...' : ''}</p>` : ''}
          ${entry.general_reflection && entry.doodle_image ? `<p><strong>Reflection:</strong> ${entry.general_reflection}</p>` : ''}
          ${entry.feelings ? `<p><strong>How I'm Feeling:</strong> ${entry.feelings.substring(0, 100)}${entry.feelings.length > 100 ? '...' : ''}</p>` : ''}
          ${entry.what_came_up ? `<p><strong>What Came Up:</strong> ${entry.what_came_up.substring(0, 100)}${entry.what_came_up.length > 100 ? '...' : ''}</p>` : ''}
          ${entry.emotions_released ? `<p><strong>Emotions Released:</strong> ${entry.emotions_released}</p>` : ''}
          ${entry.next_steps ? `<p><strong>Next Steps:</strong> ${entry.next_steps.substring(0, 100)}${entry.next_steps.length > 100 ? '...' : ''}</p>` : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading journal entries:', error);
    container.innerHTML = '<p class="error-msg">Error loading entries. Please try again.</p>';
  }
}

async function downloadEntryPDF(id) {
  window.open(`/api/journal/entries/${id}/pdf`, '_blank');
}

async function uploadEntryToDrive(id) {
  try {
    const response = await fetch(`/api/journal/entries/${id}/upload-to-drive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      alert('Entry uploaded to Google Drive!');
    } else {
      alert(result.error || 'Error uploading to Google Drive');
    }
  } catch (error) {
    console.error('Error uploading to Drive:', error);
    alert('Error uploading to Google Drive');
  }
}

async function deleteJournalEntry(id) {
  if (!confirm('Are you sure you want to delete this journal entry?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/journal/entries/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      journalEntriesLoaded = false;
      await loadJournalEntries();
      
      // Reload the profile to get accurate count from API
      const profileResponse = await fetch('/api/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const countEl = document.getElementById('journal-count');
        countEl.textContent = profileData.stats?.journal_entries || 0;
      }
    } else {
      alert('Error deleting entry');
    }
  } catch (error) {
    console.error('Error deleting entry:', error);
    alert('Error deleting entry');
  }
}

async function toggleOracleReadings() {
  const section = document.getElementById('oracle-readings-section');
  const isVisible = section.style.display !== 'none';
  
  if (isVisible) {
    section.style.display = 'none';
  } else {
    section.style.display = 'block';
    if (!oracleReadingsLoaded) {
      await loadOracleReadings();
    }
  }
}

async function loadOracleReadings() {
  const container = document.getElementById('profile-oracle-readings');
  
  try {
    const response = await fetch('/api/oracle/readings');
    
    if (response.status === 401) {
      container.innerHTML = '<p class="error-msg">Please log in to view your readings.</p>';
      return;
    }
    
    const readings = await response.json();
    oracleReadingsLoaded = true;
    
    // Update the oracle count
    const oracleCountEl = document.getElementById('oracle-count');
    if (oracleCountEl) {
      oracleCountEl.textContent = readings.length;
    }
    
    if (readings.length === 0) {
      container.innerHTML = '<p class="no-entries">No oracle readings yet. Visit the <a href="oracle.html" style="color: #c9a227;">Oracle Deck</a> to draw your first cards.</p>';
      return;
    }
    
    container.innerHTML = readings.map(reading => `
      <div class="oracle-reading-card">
        <div class="entry-card-header">
          <span class="entry-date">${formatDate(reading.created_at)}</span>
        </div>
        
        <div class="oracle-cards-list">
          ${reading.cards_drawn.map((card, idx) => `
            <div class="oracle-card-item">
              <strong class="card-title">${card}</strong>
              <p class="card-message">${reading.card_messages[idx] || ''}</p>
            </div>
          `).join('')}
        </div>
        
        ${reading.reflection ? `
        <div class="oracle-reflection">
          <strong>My Reflection:</strong>
          <p>${reading.reflection}</p>
        </div>
        ` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading oracle readings:', error);
    container.innerHTML = '<p class="error-msg">Error loading readings. Please try again.</p>';
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  const loggedOutView = document.getElementById('logged-out-view');
  const loggedInView = document.getElementById('logged-in-view');
  
  try {
    const authResponse = await fetch('/api/auth/check');
    const authData = await authResponse.json();
    
    if (authData.authenticated) {
      loggedOutView.style.display = 'none';
      loggedInView.style.display = 'block';
      
      const profileResponse = await fetch('/api/profile');
      const profileData = await profileResponse.json();
      
      const profileImage = document.getElementById('profile-image');
      const profileName = document.getElementById('profile-name');
      const profileEmail = document.getElementById('profile-email');
      const membershipBadge = document.getElementById('membership-badge');
      const journalCount = document.getElementById('journal-count');
      const memberSince = document.getElementById('member-since');
      const upgradeSection = document.getElementById('upgrade-section');
      
      if (profileData.profile_image_url) {
        profileImage.src = profileData.profile_image_url;
      } else {
        profileImage.src = 'SoulArt Brand full.png';
      }
      
      let displayName = '';
      if (profileData.first_name) {
        displayName = profileData.first_name;
        if (profileData.last_name) {
          displayName += ' ' + profileData.last_name;
        }
      } else {
        displayName = 'Beautiful Soul';
      }
      profileName.textContent = displayName;
      
      profileEmail.textContent = profileData.email || '';
      
      if (profileData.is_member) {
        membershipBadge.textContent = 'Full Member';
        membershipBadge.classList.add('premium');
        upgradeSection.style.display = 'none';
      } else {
        membershipBadge.textContent = 'Free Member';
        upgradeSection.style.display = 'block';
      }
      
      journalCount.textContent = profileData.stats?.journal_entries || 0;
      
      if (profileData.membership_started_at) {
        const date = new Date(profileData.membership_started_at);
        memberSince.textContent = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        const createdAt = new Date();
        memberSince.textContent = createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      
      const profileUpload = document.getElementById('profile-upload');
      if (profileUpload) {
        profileUpload.addEventListener('change', async function(e) {
          const file = e.target.files[0];
          if (!file) return;
          
          if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
          }
          
          if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
          }
          
          const formData = new FormData();
          formData.append('profile_image', file);
          
          try {
            const response = await fetch('/api/profile/image', {
              method: 'POST',
              body: formData
            });
            
            if (response.ok) {
              const data = await response.json();
              profileImage.src = data.image_url;
            } else {
              const error = await response.json();
              alert(error.error || 'Failed to upload image');
            }
          } catch (err) {
            alert('Error uploading image');
          }
        });
      }
      
    } else {
      loggedOutView.style.display = 'block';
      loggedInView.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    loggedOutView.style.display = 'block';
    loggedInView.style.display = 'none';
  }
});
