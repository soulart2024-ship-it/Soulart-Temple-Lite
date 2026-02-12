const disclaimerHTML = `
<div class="disclaimer-modal" id="disclaimer-modal">
  <div class="disclaimer-content">
    <button class="disclaimer-close-btn" id="disclaimer-close-btn" onclick="closeDisclaimerReadOnly()" style="display: none;">&times;</button>
    <div class="disclaimer-header">
      <h2><span class="icon">⚕️</span> Important Health Disclaimer</h2>
    </div>
    <div class="disclaimer-body">
      <h3>Welcome to SoulArt Temple</h3>
      <p>Before you begin your healing journey, please read and acknowledge the following important information:</p>
      
      <div class="disclaimer-highlight">
        <p>SoulArt Temple provides <strong>spiritual wellness tools for personal growth and self-exploration</strong>. Our services are complementary practices and are not intended to replace professional medical care.</p>
      </div>
      
      <h3>Please Understand That:</h3>
      <ul>
        <li><strong>Not Medical Advice:</strong> The information, tools, and practices offered through SoulArt Temple (including Kinesiology, emotion decoding, and energy work) are for educational and personal development purposes only.</li>
        <li><strong>No Diagnosis or Treatment:</strong> We do not diagnose, treat, cure, or prevent any disease or medical condition. Our tools are not a substitute for professional medical diagnosis or treatment.</li>
        <li><strong>Consult Professionals:</strong> If you have any health concerns, are experiencing symptoms, or are currently under medical care, please consult with a qualified healthcare provider before using our services.</li>
        <li><strong>Personal Responsibility:</strong> You are responsible for your own wellbeing. By using SoulArt Temple, you agree to take full responsibility for your choices and experiences.</li>
        <li><strong>Emotional Sensitivity:</strong> Some practices may bring up strong emotions. Please practice self-care and seek professional support if needed.</li>
      </ul>
      
      <p>Our intention is to support your journey of self-discovery and emotional wellbeing in a safe, nurturing environment.</p>
      
      <div class="disclaimer-checkbox" id="disclaimer-checkbox-section">
        <input type="checkbox" id="disclaimer-accept" name="disclaimer-accept" onchange="updateDisclaimerButton()">
        <label for="disclaimer-accept">I have read and understood this disclaimer. I acknowledge that SoulArt Temple's services are complementary practices and not medical treatment.</label>
      </div>
      
      <div class="disclaimer-actions" id="disclaimer-actions-section">
        <button class="disclaimer-btn secondary" onclick="declineDisclaimer()">I'll Come Back Later</button>
        <button class="disclaimer-btn primary" id="disclaimer-continue" disabled onclick="acceptDisclaimer()">I Understand & Accept</button>
      </div>
    </div>
    <div class="disclaimer-footer">
      <p>If you have questions about our practices, please <a href="mailto:hello@soularttemple.com" style="color: #C8963E;">contact us</a>.</p>
    </div>
  </div>
</div>
`;

function injectDisclaimer() {
  if (!document.getElementById('disclaimer-modal')) {
    document.body.insertAdjacentHTML('beforeend', disclaimerHTML);
  }
}

function showDisclaimer(onAccept, onDecline, readOnly) {
  injectDisclaimer();
  const modal = document.getElementById('disclaimer-modal');
  const checkbox = document.getElementById('disclaimer-accept');
  const continueBtn = document.getElementById('disclaimer-continue');
  const checkboxSection = document.getElementById('disclaimer-checkbox-section');
  const actionsSection = document.getElementById('disclaimer-actions-section');
  const closeBtn = document.getElementById('disclaimer-close-btn');
  
  checkbox.checked = false;
  continueBtn.disabled = true;
  
  window._disclaimerOnAccept = onAccept || function() {};
  window._disclaimerOnDecline = onDecline || function() {};
  
  if (readOnly) {
    checkboxSection.style.display = 'none';
    actionsSection.style.display = 'none';
    closeBtn.style.display = 'block';
  } else {
    checkboxSection.style.display = 'flex';
    actionsSection.style.display = 'flex';
    closeBtn.style.display = 'none';
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function showDisclaimerReadOnly() {
  showDisclaimer(null, null, true);
}

function closeDisclaimerReadOnly() {
  hideDisclaimer();
}

function hideDisclaimer() {
  const modal = document.getElementById('disclaimer-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function updateDisclaimerButton() {
  const checkbox = document.getElementById('disclaimer-accept');
  const continueBtn = document.getElementById('disclaimer-continue');
  continueBtn.disabled = !checkbox.checked;
}

function acceptDisclaimer() {
  localStorage.setItem('soulart_disclaimer_accepted', 'true');
  localStorage.setItem('soulart_disclaimer_date', new Date().toISOString());
  hideDisclaimer();
  if (typeof window._disclaimerOnAccept === 'function') {
    window._disclaimerOnAccept();
  }
}

function declineDisclaimer() {
  hideDisclaimer();
  if (typeof window._disclaimerOnDecline === 'function') {
    window._disclaimerOnDecline();
  }
}

function hasAcceptedDisclaimer() {
  return localStorage.getItem('soulart_disclaimer_accepted') === 'true';
}
