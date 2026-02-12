const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

/* PALETTES */
const chakraPalette = [
  "#e63946", // Root - Red
  "#f4a261", // Sacral - Orange
  "#e9c46a", // Solar - Yellow
  "#2a9d8f", // Heart - Green
  "#457b9d", // Throat - Blue
  "#6a4c93", // Third Eye - Indigo
  "#9d4edd"  // Crown - Violet
];

const minimalPalette = [
  "#1f1f1f", // Black
  "#6b6b6b", // Gray
  "#a68a64", // Tan
  "#4a6670", // Slate
  "#8b7355"  // Brown
];

let currentPalette = chakraPalette;
let paletteIndex = 0;
let currentColor = currentPalette[0];

/* BRUSH SETTINGS */
const brushTypes = {
  pencil: { size: 2, cap: "round", opacity: 1 },
  ink: { size: 4, cap: "round", opacity: 1 }
};
let currentBrush = "pencil";

const brushSizes = [2, 4, 8];
let sizeIndex = 0;
let currentSize = brushSizes[sizeIndex];

let drawing = false;
let mirrorOn = false;
let mandalaOn = false;
let mandalaSegments = 8;
let history = [];
let lastX = 0, lastY = 0;

function applyContextSettings() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = currentColor;
  ctx.fillStyle = currentColor;
  ctx.lineWidth = currentSize;
  ctx.globalAlpha = brushTypes[currentBrush].opacity;
}

function resizeCanvas() {
  const imageData = canvas.width > 0 ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 140;
  if (imageData) ctx.putImageData(imageData, 0, 0);
  applyContextSettings();
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* DRAWING */
canvas.addEventListener("pointerdown", e => {
  drawing = true;
  lastX = e.offsetX;
  lastY = e.offsetY;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  history.push(canvas.toDataURL());
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;

  const x = e.offsetX;
  const y = e.offsetY;

  // Draw main stroke
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();

  if (mandalaOn) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const angle = (2 * Math.PI) / mandalaSegments;
    
    for (let i = 1; i < mandalaSegments; i++) {
      const cos = Math.cos(angle * i);
      const sin = Math.sin(angle * i);
      
      // Rotate last point
      const lx = lastX - cx;
      const ly = lastY - cy;
      const rlx = cx + lx * cos - ly * sin;
      const rly = cy + lx * sin + ly * cos;
      
      // Rotate current point
      const px = x - cx;
      const py = y - cy;
      const rpx = cx + px * cos - py * sin;
      const rpy = cy + px * sin + py * cos;
      
      ctx.beginPath();
      ctx.moveTo(rlx, rly);
      ctx.lineTo(rpx, rpy);
      ctx.stroke();
    }
  } else if (mirrorOn) {
    const mx1 = canvas.width - lastX;
    const mx2 = canvas.width - x;
    ctx.beginPath();
    ctx.moveTo(mx1, lastY);
    ctx.lineTo(mx2, y);
    ctx.stroke();
  }

  lastX = x;
  lastY = y;
});

canvas.addEventListener("pointerup", () => drawing = false);
canvas.addEventListener("pointerleave", () => drawing = false);

/* TOOLS */
document.getElementById("undoBtn").onclick = () => {
  if (!history.length) return;
  const img = new Image();
  img.src = history.pop();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    applyContextSettings();
  };
};

document.getElementById("clearBtn").onclick = () => {
  if (!confirm("Clear canvas?")) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

document.getElementById("eraseBtn").onclick = () => {
  currentColor = "#f6f2ea";
  ctx.strokeStyle = currentColor;
};

document.getElementById("brushSizeBtn").onclick = () => {
  const dots = document.querySelectorAll(".size-dots .dot");
  dots.forEach(d => d.classList.remove("active"));
  sizeIndex = (sizeIndex + 1) % brushSizes.length;
  currentSize = brushSizes[sizeIndex];
  ctx.lineWidth = currentSize;
  dots[sizeIndex].classList.add("active");
};

/* TOOL PANEL - Toggle for mobile (tap instead of hover) */
const toolToggle = document.getElementById("toolToggle");
const toolPanel = document.getElementById("toolPanel");

toolToggle.onclick = (e) => {
  e.stopPropagation();
  toolPanel.classList.toggle("touch-open");
};

document.addEventListener("click", (e) => {
  if (!toolPanel.contains(e.target) && e.target !== toolToggle) {
    toolPanel.classList.remove("touch-open");
  }
});

/* TOOL PANEL - Row click to toggle submenus */
function toggleSubmenu(rowId, submenuId) {
  const row = document.getElementById(rowId);
  const submenu = document.getElementById(submenuId);
  
  row.onclick = () => {
    document.querySelectorAll(".tool-submenu").forEach(s => {
      if (s.id !== submenuId) s.classList.remove("open");
    });
    submenu.classList.toggle("open");
  };
}

toggleSubmenu("palettesRow", "palettesSubmenu");
toggleSubmenu("brushesRow", "brushesSubmenu");
toggleSubmenu("stampsRow", "stampsSubmenu");

/* Render color swatches */
function renderSwatches() {
  const container = document.getElementById("colorSwatches");
  container.innerHTML = "";
  currentPalette.forEach((color, i) => {
    const swatch = document.createElement("div");
    swatch.className = "color-swatch" + (i === paletteIndex ? " active" : "");
    swatch.style.background = color;
    swatch.onclick = () => {
      paletteIndex = i;
      currentColor = color;
      ctx.strokeStyle = currentColor;
      ctx.fillStyle = currentColor;
      document.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("active"));
      swatch.classList.add("active");
    };
    container.appendChild(swatch);
  });
}
renderSwatches();

/* Palette selection */
document.querySelectorAll("[data-palette]").forEach(btn => {
  btn.onclick = (e) => {
    e.stopPropagation();
    document.querySelectorAll("[data-palette]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    
    const type = btn.dataset.palette;
    currentPalette = type === "chakra" ? chakraPalette : minimalPalette;
    paletteIndex = 0;
    currentColor = currentPalette[0];
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
    renderSwatches();
  };
});

/* Brush selection */
document.querySelectorAll("[data-brush]").forEach(btn => {
  btn.onclick = (e) => {
    e.stopPropagation();
    document.querySelectorAll("[data-brush]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    
    currentBrush = btn.dataset.brush;
    const brush = brushTypes[currentBrush];
    ctx.globalAlpha = brush.opacity;
  };
});

/* Mirror toggle */
document.getElementById("mirrorToggle").onclick = function(e) {
  e.stopPropagation();
  mirrorOn = !mirrorOn;
  mandalaOn = false;
  this.classList.toggle("active", mirrorOn);
  document.getElementById("mandalaToggle").classList.remove("active");
};

/* Mandala toggle */
document.getElementById("mandalaToggle").onclick = function(e) {
  e.stopPropagation();
  mandalaOn = !mandalaOn;
  mirrorOn = false;
  this.classList.toggle("active", mandalaOn);
  document.getElementById("mirrorToggle").classList.remove("active");
};

/* Save to Profile - requires login */
document.getElementById("saveRow").onclick = async () => {
  try {
    const response = await fetch('/api/auth/check');
    const data = await response.json();
    
    if (!data.authenticated) {
      if (confirm('Sign in to save your markings to your profile. Would you like to sign in now?')) {
        window.location.href = '/login.html?next=' + encodeURIComponent(window.location.pathname);
      }
      return;
    }
    
    // Save to profile via API
    const imageData = canvas.toDataURL('image/png');
    const saveResponse = await fetch('/api/markings/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    });
    
    if (saveResponse.ok) {
      alert('Marking saved to your profile!');
    } else {
      alert('Could not save. Please try again.');
    }
  } catch (error) {
    console.error('Save error:', error);
    alert('Could not save. Please try again.');
  }
};

/* Print - go to print studio with preview */
document.getElementById("printRow").onclick = () => {
  const imageData = canvas.toDataURL('image/png');
  localStorage.setItem('markings_print_image', imageData);
  window.location.href = '/print-studio.html';
};

/* PROMPTS */
const prompts = [
  "Let the hand move.",
  "No shape is wrong.",
  "Follow pressure, not thought."
];

document.getElementById("promptToggle").onclick = () => {
  const box = document.getElementById("promptBox");
  const text = document.getElementById("promptText");
  text.textContent = prompts[Math.floor(Math.random() * prompts.length)];
  box.classList.toggle("hidden");
};

/* SOUND */
const audio = document.getElementById("audioPlayer");
const sounds = {
  flow: "audio/calm-meditation-with-nature-sound-357943 copy.mp3",
  still: "audio/chakra-balance.mp3",
  earth: "audio/serenity-waves-zen-meditation-247329.mp3"
};

document.getElementById("soundToggle").onclick = () => {
  document.getElementById("soundPanel").classList.toggle("hidden");
};

document.querySelectorAll("[data-sound]").forEach(btn => {
  btn.onclick = () => {
    const type = btn.dataset.sound;
    if (type === "off") {
      audio.pause();
      audio.currentTime = 0;
      return;
    }
    audio.src = sounds[type];
    audio.volume = 0.3;
    audio.play();
  };
});

document.querySelectorAll("[data-vol]").forEach(span => {
  span.onclick = () => audio.volume = parseFloat(span.dataset.vol);
});