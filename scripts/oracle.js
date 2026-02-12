// SoulArt Oracle Full Deck
const soulArtCards = [
  { title: "Arrival", message: "You have always arrived.\nThis moment is not a beginning — it is a recognition.\nYour presence here is simply confirmation of what has already been true." },
  { title: "Enough", message: "Your greatest volume already lives within you.\nYou may turn it up, soften it, or let it rest.\nThe choice has always been yours." },
  { title: "Still Ground", message: "Fluidity is the essence of life —\nfrom the cells within your body to the water that sustains you.\nEven stillness carries movement.\nThe support you seek is already beneath you." },
  { title: "Permission", message: "Nothing needs to be earned here.\nYou are not late, and you are not behind.\nYou are allowed to be exactly where you are — without explanation." },
  { title: "Unfolding", message: "There is no rush in what is becoming.\nLife opens the way it always has — layer by layer.\nYou are not stuck. You are unfolding." },
  { title: "Listening", message: "The guidance you seek does not arrive loudly. It lives in sensation, in pause, in the quiet yes of your body. When you soften, it becomes easier to hear." },
  { title: "Held", message: "You are not carrying this alone. Even when you cannot name the support, it is present. There is more holding you than you realise." },
  { title: "Pause", message: "Not everything needs your response. Stillness is not avoidance — it is wisdom choosing its moment to listen." },
  { title: "Softening", message: "Strength does not always brace. Sometimes it loosens its grip and allows life to meet it halfway." },
  { title: "Return", message: "You have wandered, as all things do. Nothing was lost. This moment is simply you finding yourself again." },
  { title: "Weightless", message: "What you are carrying may not be yours anymore. You are allowed to set it down without knowing what comes next." },
  { title: "Trust the Pace", message: "What is true does not hurry. What is real does not chase. You are moving at exactly the speed required." },
  { title: "Quiet Yes", message: "Not every decision arrives as certainty. Sometimes it comes as relief. Listen for that." },
  { title: "Witness", message: "You do not need to fix what you are feeling. Let it be seen. That alone changes everything." },
  { title: "Unhook", message: "Not every story belongs to you anymore. What once shaped you does not need to define you. Release the hook — your presence is enough." },
  { title: "Inner Tide", message: "There is a rhythm beneath your thoughts that knows when to rise and when to retreat. Listen there. The tide never rushes — yet it always arrives." },
  { title: "Reclaim", message: "What you gave away to survive can now be called home. Reclaiming yourself is not going backwards — it is returning whole." },
  { title: "Gentle Authority", message: "You do not need to raise your voice to be sovereign. Your calm is your command. Your steadiness is already leading." },
  { title: "Ease", message: "You are not late. Nothing is missing. What is meant to meet you is not in a hurry." },
  { title: "Allow", message: "What moves through you does not ask permission. Let it pass without naming. Let it leave without holding." },
  { title: "Enoughness", message: "There is no threshold you must cross to be worthy of rest. You are already sufficient in this breath." },
  { title: "Soften the Edges", message: "What has been held tightly can loosen now. You do not need to brace to remain intact." },
  { title: "The Middle", message: "You are not between destinations. This is not a waiting room. Life is happening right here." },
  { title: "Stay", message: "You do not need to leave yourself to be safe. Remain present. Nothing is asking you to disappear." },
  { title: "Releasing Effort", message: "What is true does not require force. What belongs will continue without strain." },
  { title: "Unnamed", message: "Not everything needs language. Some experiences complete themselves before words arrive." },
  { title: "Receiving", message: "You do not have to prepare to be supported. Let what is offered reach you." },
  { title: "Quiet Strength", message: "There is power in what does not announce itself. Your steadiness is felt." },
  { title: "Inhabiting", message: "Come fully into this moment. Not to change it — to live inside it." },
  { title: "The Body Knows", message: "Before thought arrives, there is recognition. Trust the intelligence that lives beneath explanation." },
  { title: "Gentle Clearing", message: "What is leaving does not need to be pushed. Make space and it will pass." },
  { title: "Resting Inside Trust", message: "You do not need certainty to relax. Trust can exist without guarantees." },
  { title: "Presence", message: "Nothing else is required of you. Your being here is the participation for your remembrance." },
  { title: "Unravel", message: "What has tightened over time can unwind slowly. There is no deadline for release." },
  { title: "Alignment", message: "You will feel it before you understand it. Ease is the signal. Follow that." },
  { title: "Spaciousness", message: "There is more room here than you thought. Breathe into it." },
  { title: "Without Grasping", message: "You do not need to hold life still to keep it. What remains does so willingly." },
  { title: "Grounded Lightness", message: "Stability does not mean heaviness. You are allowed to feel supported and free." },
  { title: "Quiet Return", message: "You have not drifted too far. Nothing needs correcting. This moment is the way back." },
  { title: "Tender Confidence", message: "You can move gently and still be certain. Softness does not dilute truth." },
  { title: "Settling", message: "Let what has stirred find its resting place. Integration happens when nothing is forced." },
  { title: "Home", message: "There is nothing left to seek. You are already within what you were looking for." }
];

// Draw a single card
function drawOneCard() {
  const card = soulArtCards[Math.floor(Math.random() * soulArtCards.length)];
  showModal(card.title, card.message);
}

// Draw 3 cards
function drawThreeCards() {
  const cards = pickUniqueCards(3);
  showModal("3-Card Spread", formatCards(cards));
}

// Draw 5 cards
function drawFiveCards() {
  const cards = pickUniqueCards(5);
  showModal("5-Card Deep Dive", formatCards(cards));
}

// Show full deck
function showFullDeck() {
  const formatted = soulArtCards.map(card => `<strong>${card.title}</strong>: ${card.message}`).join("<br><br>");
  showModal("Full SoulArt Oracle Deck", formatted);
}

// Utility functions
function pickUniqueCards(n) {
  const copy = [...soulArtCards];
  const result = [];
  for (let i = 0; i < n; i++) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }
  return result;
}

function formatCards(cards) {
  return cards.map(card => `<strong>${card.title}</strong><br>${card.message}`).join("<br><br>");
}

function showModal(title, message) {
  document.getElementById("cardTitle").innerText = title;
  document.getElementById("cardMessage").innerHTML = message;
  document.getElementById("oracleModal").style.display = "block";
}

function closeModal() {
  document.getElementById("oracleModal").style.display = "none";
}

// Close modal if clicked outside
window.onclick = function(event) {
  const modal = document.getElementById("oracleModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};