import {
  pencilBrush,
  inkBrush,
  softBrush,
  watercolourBrush,
  crayonBrush,
  alcoholInkBrush
} from './brush_functions.js';

const CHAKRA_PALETTES = {
  root: {
    name: 'Root',
    colours: ['#7A1F1F', '#A94442', '#C96A6A', '#E8B4B4', '#4A1C1C']
  },
  sacral: {
    name: 'Sacral',
    colours: ['#D35400', '#E67E22', '#F39C12', '#FAD7A0', '#A04000']
  },
  solar: {
    name: 'Solar Plexus',
    colours: ['#F1C40F', '#F7DC6F', '#FCF3CF', '#D4AC0D', '#9A7D0A']
  },
  heart: {
    name: 'Heart',
    colours: ['#2ECC71', '#58D68D', '#A9DFBF', '#1D8348', '#145A32']
  },
  throat: {
    name: 'Throat',
    colours: ['#3498DB', '#5DADE2', '#AED6F1', '#21618C', '#154360']
  },
  thirdEye: {
    name: 'Third Eye',
    colours: ['#5B2C6F', '#76448A', '#BB8FCE', '#4A235A', '#2E1A47']
  },
  crown: {
    name: 'Crown',
    colours: ['#F4ECF7', '#E8DAEF', '#D2B4DE', '#A569BD', '#7D3C98']
  }
};

const brushes = {
  pencil: pencilBrush,
  ink: inkBrush,
  paint: softBrush,
  water: watercolourBrush,
  crayon: crayonBrush,
  alcohol: alcoholInkBrush
};

document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('doodleCanvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  const modeButtons = document.querySelectorAll('.mode-btn');
  const colorPicker = document.getElementById('colorPicker');
  const colorLabel = document.getElementById('colorLabel');
  const brushSizeSlider = document.getElementById('brushSize');
  const brushSizeValue = document.getElementById('brushSizeValue');
  const symmetrySelect = document.getElementById('symmetrySelect');
  const templateSelect = document.getElementById('templateSelect');
  const symmetryGroup = document.getElementById('symmetryGroup');
  const templateGroup = document.getElementById('templateGroup');
  const colouringSection = document.getElementById('colouringSection');
  const colouringSelect = document.getElementById('colouringSelect');
  const undoBtn = document.getElementById('undoBtn');
  const clearBtn = document.getElementById('clearBtn');
  const resetTemplateBtn = document.getElementById('resetTemplateBtn');
  const resetViewBtn = document.getElementById('resetViewBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let currentMode = 'free';
  let currentBrush = 'pencil';
  let brushSize = 5;
  let brushOpacity = 1;
  let brushColor = '#C8963E';
  let currentSymmetry = 8;
  let currentTemplate = '';
  let currentColouringPage = '';
  let colouringOutlineImage = null;
  let undoStack = [];
  const MAX_UNDO = 20;
  let templateImage = null;
  let mirrorMode = false;
  
  let viewport = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    minScale: 0.5,
    maxScale: 3
  };
  
  let gestureState = {
    isPinching: false,
    initialDistance: 0,
    initialScale: 1,
    lastCenterX: 0,
    lastCenterY: 0
  };
  
  const brushOpacitySlider = document.getElementById('brushOpacity');
  const opacityValue = document.getElementById('opacityValue');
  
  // Sacred Stamps DOM refs
  const stampSelect = document.getElementById('stampSelect');
  const stampSizeSlider = document.getElementById('stampSize');
  const stampSizeValue = document.getElementById('stampSizeValue');
  const stampRotationSlider = document.getElementById('stampRotation');
  const stampRotValue = document.getElementById('stampRotValue');
  const stampFillToggle = document.getElementById('stampFillToggle');
  const kaleidoscopeToggle = document.getElementById('kaleidoscopeToggle');

  let currentStamp = '';
  let stampSize = 90;
  let stampRotation = 0;
  let stampFill = false;
  let kaleidoscopeMirror = false;
  
  const MANDALA_TEMPLATES = {
    mandala1: 'Petals - Simple concentric circles with petal shapes',
    mandala2: 'Star Bloom - Multi-pointed star with layered petals',
    mandala3: 'Lotus Wheel - Lotus pattern in circular form',
    mandala4: 'Sun Halo - Radiating sun rays',
    mandala5: 'Spiral Flower - Spiral symmetry with floral elements',
    mandala6: 'Sacred Web - Interconnected web pattern',
    mandala7: 'Radiant Rings - Concentric rings with detail',
    mandala8: 'Heart Bloom - Hearts arranged in mandala',
    mandala9: 'Cosmic Petals - Organic flowing petal pattern',
    mandala10: 'Temple Wheel - Geometric wheel pattern'
  };
  
  const colorNames = {
    '#C8963E': 'Gold',
    '#1F1F2E': 'Navy',
    '#E8B5C7': 'Pink',
    '#4A8B6E': 'Emerald',
    '#FFFFFF': 'White',
    '#000000': 'Black',
    '#B22222': 'Red',
    '#8F5AFF': 'Purple'
  };
  
  // --- Vector Stamp Library (Path2D) ---
  const STAMPS = {
    hexagon: {
      paths: [
        "M 50 5 L 90 27.5 L 90 72.5 L 50 95 L 10 72.5 L 10 27.5 Z"
      ]
    },
    triangle: {
      paths: [
        "M 50 8 L 92 88 L 8 88 Z"
      ]
    },
    heart: {
      paths: [
        "M 50 88 C 22 68 10 52 10 36 C 10 22 22 12 36 12 C 44 12 48 16 50 20 C 52 16 56 12 64 12 C 78 12 90 22 90 36 C 90 52 78 68 50 88 Z"
      ]
    },
    leaf: {
      paths: [
        "M 18 78 C 22 38 50 12 82 18 C 78 50 54 84 18 78 Z",
        "M 22 72 C 46 62 62 46 78 26"
      ]
    },
    lotus: {
      paths: [
        "M 50 10 C 44 22 44 34 50 44 C 56 34 56 22 50 10 Z",
        "M 32 22 C 30 38 38 52 50 58 C 46 44 42 32 32 22 Z",
        "M 68 22 C 58 32 54 44 50 58 C 62 52 70 38 68 22 Z",
        "M 22 46 C 30 62 40 72 50 76 C 44 64 34 54 22 46 Z",
        "M 78 46 C 66 54 56 64 50 76 C 60 72 70 62 78 46 Z"
      ]
    },
    seedOfLife: {
      circles: [
        { x: 50, y: 50, r: 22 },
        { x: 50, y: 28, r: 22 },
        { x: 69, y: 39, r: 22 },
        { x: 69, y: 61, r: 22 },
        { x: 50, y: 72, r: 22 },
        { x: 31, y: 61, r: 22 },
        { x: 31, y: 39, r: 22 }
      ]
    },
    flowerOfLife: {
      circles: [
        { x: 50, y: 50, r: 20 },
        { x: 50, y: 30, r: 20 },
        { x: 67, y: 40, r: 20 },
        { x: 67, y: 60, r: 20 },
        { x: 50, y: 70, r: 20 },
        { x: 33, y: 60, r: 20 },
        { x: 33, y: 40, r: 20 },
        { x: 50, y: 10, r: 20 },
        { x: 84, y: 30, r: 20 },
        { x: 84, y: 70, r: 20 },
        { x: 50, y: 90, r: 20 },
        { x: 16, y: 70, r: 20 },
        { x: 16, y: 30, r: 20 }
      ]
    },
    metatron: {
      circles: [
        { x: 50, y: 50, r: 18 },
        { x: 50, y: 22, r: 8 },
        { x: 74, y: 36, r: 8 },
        { x: 74, y: 64, r: 8 },
        { x: 50, y: 78, r: 8 },
        { x: 26, y: 64, r: 8 },
        { x: 26, y: 36, r: 8 }
      ],
      lines: [
        [50,22,74,36],[74,36,74,64],[74,64,50,78],[50,78,26,64],[26,64,26,36],[26,36,50,22],
        [50,22,50,78],[26,36,74,64],[74,36,26,64]
      ]
    },
    sriYantra: {
      paths: [
        "M 50 12 L 86 78 L 14 78 Z",
        "M 50 20 L 80 74 L 20 74 Z",
        "M 50 78 L 14 30 L 86 30 Z",
        "M 50 70 L 20 34 L 80 34 Z"
      ],
      circles: [{ x: 50, y: 50, r: 40 }]
    },
    catHead: {
      paths: [
        "M 22 44 L 18 18 L 34 30 L 50 20 L 66 30 L 82 18 L 78 44 C 78 70 64 84 50 84 C 36 84 22 70 22 44 Z",
        "M 36 54 C 40 50 44 50 48 54",
        "M 64 54 C 60 50 56 50 52 54",
        "M 50 58 C 48 62 46 64 44 66",
        "M 50 58 C 52 62 54 64 56 66"
      ]
    }
  };

  const STAMP_CACHE = {};
  function getStampPaths(stampKey) {
    if (!stampKey || !STAMPS[stampKey]) return null;
    if (STAMP_CACHE[stampKey]) return STAMP_CACHE[stampKey];

    const def = STAMPS[stampKey];
    const compiled = {
      paths: (def.paths || []).map(d => new Path2D(d)),
      circles: def.circles || [],
      lines: def.lines || []
    };
    STAMP_CACHE[stampKey] = compiled;
    return compiled;
  }
  
  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();
    
    // On mobile (< 600px), use more of the available space
    const isMobile = window.innerWidth <= 600;
    const padding = isMobile ? 4 : 20;
    const maxSize = isMobile ? 2000 : 700;
    
    const size = Math.min(rect.width - padding, rect.height - padding, maxSize);
    
    const saved = canvas.toDataURL();
    
    canvas.width = size;
    canvas.height = size;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (saved && saved !== 'data:,') {
      const img = new Image();
      img.onload = function() {
        ctx.drawImage(img, 0, 0);
      };
      img.src = saved;
    }
    
    if (templateImage && currentMode === 'trace') {
      renderTemplate();
    }
  }
  
  function renderTemplate() {
    if (!templateImage) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = Math.min(canvas.width, canvas.height) * 0.45;
    
    ctx.globalAlpha = 0.25;
    ctx.drawImage(templateImage, centerX - scale, centerY - scale, scale * 2, scale * 2);
    ctx.globalAlpha = 1;
  }
  
  function wobble(value, amount = 1.5) {
    return value + (Math.random() - 0.5) * amount;
  }
  
  function softLineWidth(base = 2.4) {
    return base + (Math.random() - 0.5) * 0.6;
  }
  
  function softStroke() {
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth *= 0.7;
    ctx.stroke();
    ctx.globalAlpha = 0.85;
  }

  function renderColouringPage(type) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const size = Math.min(canvas.width, canvas.height) * 0.4;
    
    ctx.save();
    ctx.strokeStyle = '#B8B1A4'; // warm parchment grey
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.85;
    
    switch (type) {
      case 'lotus':
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(
            wobble(cx + Math.cos(angle) * size * 0.25),
            wobble(cy + Math.sin(angle) * size * 0.25),
            wobble(size * 0.22, 2),
            wobble(size * 0.42, 2),
            angle + wobble(0, 0.05),
            0,
            Math.PI * 2
          );
          ctx.lineWidth = softLineWidth(2.3);
          softStroke();
        }
        break;
        
      case 'flower':
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(
            wobble(cx + Math.cos(angle) * size * 0.32),
            wobble(cy + Math.sin(angle) * size * 0.32),
            wobble(size * 0.32, 2),
            0,
            Math.PI * 2
          );
          ctx.lineWidth = softLineWidth(2);
          softStroke();
        }
        ctx.beginPath();
        ctx.arc(wobble(cx), wobble(cy), wobble(size * 0.32, 2), 0, Math.PI * 2);
        ctx.lineWidth = softLineWidth(2);
        softStroke();
        break;
        
      case 'heart':
        ctx.beginPath();
        ctx.moveTo(wobble(cx, 2), wobble(cy + size * 0.25, 2));
        ctx.bezierCurveTo(
          wobble(cx - size * 0.5, 3), wobble(cy - size * 0.1, 3),
          wobble(cx - size * 0.25, 3), wobble(cy - size * 0.45, 3),
          wobble(cx, 2), wobble(cy - size * 0.2, 2)
        );
        ctx.bezierCurveTo(
          wobble(cx + size * 0.25, 3), wobble(cy - size * 0.45, 3),
          wobble(cx + size * 0.5, 3), wobble(cy - size * 0.1, 3),
          wobble(cx, 2), wobble(cy + size * 0.25, 2)
        );
        ctx.lineWidth = softLineWidth(2.5);
        softStroke();
        break;
        
      case 'mandala':
        for (let r = size * 0.2; r <= size * 0.8; r += size * 0.15) {
          ctx.beginPath();
          ctx.arc(wobble(cx), wobble(cy), wobble(r, 2), 0, Math.PI * 2);
          ctx.lineWidth = softLineWidth(2);
          softStroke();
        }
        break;
        
      case 'leaves':
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(
            wobble(cx + Math.cos(angle) * size * 0.35),
            wobble(cy + Math.sin(angle) * size * 0.35),
            wobble(size * 0.12, 2),
            wobble(size * 0.28, 2),
            angle + wobble(0, 0.05),
            0,
            Math.PI * 2
          );
          ctx.lineWidth = softLineWidth(2.2);
          softStroke();
        }
        break;
    }
    
    ctx.restore();
    
    // Store the outline image for redrawing
    colouringOutlineImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    saveState();
  }
  
  function generateMandalaTemplate(name) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 500;
    tempCanvas.height = 500;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.strokeStyle = '#d0d0d0';
    tempCtx.lineWidth = 1.5;
    
    const cx = 250;
    const cy = 250;
    
    if (name === 'mandala1') {
      for (let r = 50; r <= 200; r += 30) {
        tempCtx.beginPath();
        tempCtx.arc(cx, cy, r, 0, Math.PI * 2);
        tempCtx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        tempCtx.beginPath();
        tempCtx.moveTo(cx, cy);
        tempCtx.lineTo(cx + Math.cos(angle) * 200, cy + Math.sin(angle) * 200);
        tempCtx.stroke();
      }
    } else if (name === 'mandala2') {
      for (let r = 40; r <= 200; r += 30) {
        tempCtx.beginPath();
        tempCtx.arc(cx, cy, r, 0, Math.PI * 2);
        tempCtx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        tempCtx.beginPath();
        tempCtx.moveTo(cx + Math.cos(angle) * 50, cy + Math.sin(angle) * 50);
        tempCtx.lineTo(cx + Math.cos(angle) * 200, cy + Math.sin(angle) * 200);
        tempCtx.stroke();
      }
    } else if (name === 'mandala3') {
      for (let r = 30; r <= 200; r += 25) {
        tempCtx.beginPath();
        tempCtx.arc(cx, cy, r, 0, Math.PI * 2);
        tempCtx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        tempCtx.beginPath();
        tempCtx.moveTo(cx, cy);
        tempCtx.lineTo(cx + Math.cos(angle) * 180, cy + Math.sin(angle) * 180);
        tempCtx.stroke();
      }
    } else if (name === 'mandala4') {
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        tempCtx.beginPath();
        tempCtx.moveTo(cx, cy);
        tempCtx.lineTo(cx + Math.cos(angle) * 200, cy + Math.sin(angle) * 200);
        tempCtx.stroke();
      }
      for (let r = 60; r <= 200; r += 40) {
        tempCtx.beginPath();
        tempCtx.arc(cx, cy, r, 0, Math.PI * 2);
        tempCtx.stroke();
      }
    } else if (name === 'mandala5') {
      for (let r = 20; r <= 200; r += 15) {
        tempCtx.beginPath();
        tempCtx.arc(cx, cy, r, 0, Math.PI * 2);
        tempCtx.stroke();
      }
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        for (let r = 50; r <= 200; r += 50) {
          tempCtx.beginPath();
          tempCtx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 8, 0, Math.PI * 2);
          tempCtx.stroke();
        }
      }
    } else if (name === 'mandala6') {
      for (let r = 50; r <= 200; r += 30) {
        tempCtx.beginPath();
        tempCtx.arc(cx, cy, r, 0, Math.PI * 2);
        tempCtx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        for (let j = 0; j < 3; j++) {
          const r = 70 + j * 40;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          tempCtx.beginPath();
          tempCtx.arc(x, y, 15, 0, Math.PI * 2);
          tempCtx.stroke();
        }
      }
    } else if (name === 'mandala7') {
      for (let r = 40; r <= 200; r += 20) {
        tempCtx.beginPath();
        tempCtx.arc(cx, cy, r, 0, Math.PI * 2);
        tempCtx.stroke();
      }
    } else if (name === 'mandala8') {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        for (let r = 60; r <= 200; r += 50) {
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          tempCtx.beginPath();
          tempCtx.moveTo(x - 15, y);
          tempCtx.bezierCurveTo(x - 15, y - 15, x, y - 30, x, y);
          tempCtx.bezierCurveTo(x, y - 30, x + 15, y - 15, x + 15, y);
          tempCtx.bezierCurveTo(x + 15, y + 15, x, y + 30, x, y);
          tempCtx.bezierCurveTo(x, y + 30, x - 15, y + 15, x - 15, y);
          tempCtx.stroke();
        }
      }
      for (let r = 30; r <= 200; r += 40) {
        tempCtx.beginPath();
        tempCtx.arc(cx, cy, r, 0, Math.PI * 2);
        tempCtx.stroke();
      }
    } else if (name === 'mandala9') {
      for (let r = 35; r <= 200; r += 25) {
        tempCtx.beginPath();
        tempCtx.arc(cx, cy, r, 0, Math.PI * 2);
        tempCtx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        tempCtx.beginPath();
        tempCtx.moveTo(cx, cy);
        tempCtx.lineTo(cx + Math.cos(angle) * 190, cy + Math.sin(angle) * 190);
        tempCtx.stroke();
      }
    } else if (name === 'mandala10') {
      for (let r = 50; r <= 200; r += 30) {
        tempCtx.beginPath();
        tempCtx.arc(cx, cy, r, 0, Math.PI * 2);
        tempCtx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        tempCtx.beginPath();
        tempCtx.moveTo(cx + Math.cos(angle) * 50, cy + Math.sin(angle) * 50);
        tempCtx.lineTo(cx + Math.cos(angle) * 200, cy + Math.sin(angle) * 200);
        tempCtx.stroke();
      }
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 8;
        tempCtx.beginPath();
        tempCtx.moveTo(cx + Math.cos(angle) * 50, cy + Math.sin(angle) * 50);
        tempCtx.lineTo(cx + Math.cos(angle) * 200, cy + Math.sin(angle) * 200);
        tempCtx.stroke();
      }
    }
    
    const img = new Image();
    img.src = tempCanvas.toDataURL();
    return img;
  }
  
  function getPointerPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }
  
  function saveState() {
    if (undoStack.length >= MAX_UNDO) {
      undoStack.shift();
    }
    undoStack.push(canvas.toDataURL());
    updateUndoButton();
  }
  
  function updateUndoButton() {
    undoBtn.disabled = undoStack.length <= 1;
    undoBtn.style.opacity = undoStack.length <= 1 ? '0.5' : '1';
  }
  
  function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  function getTouchCenter(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }
  
  function startDrawing(e) {
    e.preventDefault();
    
    if (e.touches && e.touches.length === 2) {
      gestureState.isPinching = true;
      gestureState.initialDistance = getTouchDistance(e.touches);
      gestureState.initialScale = viewport.scale;
      const center = getTouchCenter(e.touches);
      gestureState.lastCenterX = center.x;
      gestureState.lastCenterY = center.y;
      canvas.style.cursor = 'grabbing';
      return;
    }
    
    if (currentMode === 'hand') {
      isDrawing = true;
      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      gestureState.lastCenterX = clientX;
      gestureState.lastCenterY = clientY;
      canvas.style.cursor = 'grabbing';
      return;
    }
    
    const pos = getPointerPosition(e);
    
    // If a stamp is selected, place stamp on click/tap
    if (currentStamp) {
      stampAt(pos.x, pos.y);
      isDrawing = false;
      return;
    }
    
    isDrawing = true;
    lastX = pos.x;
    lastY = pos.y;
    
    ctx.globalAlpha = brushOpacity;
    ctx.beginPath();
    ctx.arc(lastX, lastY, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = brushColor;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    if (currentMode === 'mandala') {
      drawMirroredPoint(lastX, lastY, brushSize, brushColor);
    }
  }
  
  function drawMirroredPoint(x, y, size, color) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const segmentAngle = (Math.PI * 2) / currentSymmetry;
    
    ctx.globalAlpha = brushOpacity;
    for (let i = 1; i < currentSymmetry; i++) {
      const angle = i * segmentAngle;
      const dx = x - centerX;
      const dy = y - centerY;
      
      const newDx = dx * Math.cos(angle) - dy * Math.sin(angle);
      const newDy = dx * Math.sin(angle) + dy * Math.cos(angle);
      const newX = centerX + newDx;
      const newY = centerY + newDy;
      
      ctx.beginPath();
      ctx.arc(newX, newY, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  
  function applyViewportTransform() {
    canvas.style.transform = `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`;
    canvas.style.transformOrigin = 'center center';
  }
  
  function draw(e) {
    e.preventDefault();
    
    if (e.touches && e.touches.length === 2) {
      if (!gestureState.isPinching) {
        gestureState.isPinching = true;
        gestureState.initialDistance = getTouchDistance(e.touches);
        gestureState.initialScale = viewport.scale;
        const center = getTouchCenter(e.touches);
        gestureState.lastCenterX = center.x;
        gestureState.lastCenterY = center.y;
      }
      
      const currentDistance = getTouchDistance(e.touches);
      const scaleFactor = currentDistance / gestureState.initialDistance;
      let newScale = gestureState.initialScale * scaleFactor;
      newScale = Math.max(viewport.minScale, Math.min(viewport.maxScale, newScale));
      viewport.scale = newScale;
      
      const center = getTouchCenter(e.touches);
      viewport.offsetX += (center.x - gestureState.lastCenterX);
      viewport.offsetY += (center.y - gestureState.lastCenterY);
      gestureState.lastCenterX = center.x;
      gestureState.lastCenterY = center.y;
      
      applyViewportTransform();
      isDrawing = false;
      return;
    }
    
    if (!isDrawing) return;
    
    if (currentMode === 'hand') {
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      if (gestureState.lastCenterX !== 0 || gestureState.lastCenterY !== 0) {
        viewport.offsetX += (clientX - gestureState.lastCenterX);
        viewport.offsetY += (clientY - gestureState.lastCenterY);
        applyViewportTransform();
      }
      gestureState.lastCenterX = clientX;
      gestureState.lastCenterY = clientY;
      return;
    }
    
    const pos = getPointerPosition(e);
    const from = { x: lastX, y: lastY };
    const to = { x: pos.x, y: pos.y };
    const settings = { colour: brushColor, size: brushSize, opacity: brushOpacity };
    
    if (currentBrush === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else if (brushes[currentBrush]) {
      brushes[currentBrush](ctx, from, to, settings);
    } else {
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = brushOpacity;
      ctx.strokeStyle = brushColor;
      ctx.lineCap = 'round';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
    
    if (currentMode === 'mandala' && currentBrush !== 'eraser') {
      drawMirroredLine(lastX, lastY, pos.x, pos.y);
    }
    
    if (currentMode === 'mirror' && currentBrush !== 'eraser') {
      drawMirrorLine(lastX, lastY, pos.x, pos.y);
    }
    
    ctx.globalAlpha = 1;
    lastX = pos.x;
    lastY = pos.y;
  }
  
  function drawMirroredLine(x1, y1, x2, y2) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const segmentAngle = (Math.PI * 2) / currentSymmetry;
    
    ctx.globalAlpha = brushOpacity;
    for (let i = 1; i < currentSymmetry; i++) {
      const angle = i * segmentAngle;
      
      const dx1 = x1 - centerX;
      const dy1 = y1 - centerY;
      const newDx1 = dx1 * Math.cos(angle) - dy1 * Math.sin(angle);
      const newDy1 = dx1 * Math.sin(angle) + dy1 * Math.cos(angle);
      const newX1 = centerX + newDx1;
      const newY1 = centerY + newDy1;
      
      const dx2 = x2 - centerX;
      const dy2 = y2 - centerY;
      const newDx2 = dx2 * Math.cos(angle) - dy2 * Math.sin(angle);
      const newDy2 = dx2 * Math.sin(angle) + dy2 * Math.cos(angle);
      const newX2 = centerX + newDx2;
      const newY2 = centerY + newDy2;
      
      ctx.beginPath();
      ctx.moveTo(newX1, newY1);
      ctx.lineTo(newX2, newY2);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  
  function drawMirrorLine(x1, y1, x2, y2) {
    const points = [
      [x1, y1, x2, y2],                             // original
      [canvas.width - x1, y1, canvas.width - x2, y2], // horizontal
      [x1, canvas.height - y1, x2, canvas.height - y2], // vertical
      [canvas.width - x1, canvas.height - y1, canvas.width - x2, canvas.height - y2] // both
    ];

    ctx.globalAlpha = brushOpacity;

    points.forEach(p => {
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(p[2], p[3]);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.stroke();
    });

    ctx.globalAlpha = 1;
  }
  
  // Animate stamp placement with gentle scale-in effect
  function animateStampPlacement(drawFn, onComplete) {
    const duration = 200;
    const startScale = 0.92;
    const endScale = 1;
    const easing = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    
    const startTime = performance.now();
    
    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easing(progress);
      const scale = startScale + (endScale - startScale) * eased;
      const opacity = 0.85 + (0.15 * eased);
      
      drawFn(scale, opacity);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    }
    
    requestAnimationFrame(animate);
  }
  
  function stampAt(x, y) {
    if (!currentStamp) return;

    const stamp = getStampPaths(currentStamp);
    if (!stamp) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRot = (stampRotation * Math.PI) / 180;
    
    // Capture canvas state before animation
    const baseImage = ctx.getImageData(0, 0, canvas.width, canvas.height);

    function drawStampOnce(px, py, rotationRad, mirrorX, animScale, animOpacity) {
      ctx.save();
      ctx.globalAlpha = brushOpacity * animOpacity;

      ctx.translate(px, py);
      ctx.rotate(rotationRad);

      if (mirrorX) ctx.scale(-1, 1);

      const s = (stampSize / 100) * animScale;
      ctx.scale(s, s);
      ctx.translate(-50, -50);

      ctx.lineWidth = Math.max(1, brushSize / 4);
      ctx.strokeStyle = brushColor;
      ctx.fillStyle = brushColor;

      if (stamp.circles.length) {
        stamp.circles.forEach(c => {
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          stampFill ? ctx.fill() : ctx.stroke();
        });
      }

      if (stamp.lines.length) {
        stamp.lines.forEach(l => {
          ctx.beginPath();
          ctx.moveTo(l[0], l[1]);
          ctx.lineTo(l[2], l[3]);
          ctx.stroke();
        });
      }

      stamp.paths.forEach(p => {
        stampFill ? ctx.fill(p) : ctx.stroke(p);
      });

      ctx.restore();
      ctx.globalAlpha = 1;
    }
    
    function drawAllStamps(scale, opacity) {
      // Restore base canvas state
      ctx.putImageData(baseImage, 0, 0);
      
      if (currentMode !== 'mandala') {
        drawStampOnce(x, y, baseRot, false, scale, opacity);
        return;
      }
      
      const segmentAngle = (Math.PI * 2) / currentSymmetry;
      const dx = x - centerX;
      const dy = y - centerY;
      
      for (let i = 0; i < currentSymmetry; i++) {
        const angle = i * segmentAngle;
        const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
        const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
        
        const px = centerX + rx;
        const py = centerY + ry;
        
        const mirror = kaleidoscopeMirror ? (i % 2 === 1) : false;
        drawStampOnce(px, py, baseRot + angle, mirror, scale, opacity);
      }
    }
    
    animateStampPlacement(drawAllStamps, saveState);
  }
  
  function stopDrawing(e) {
    if (e) e.preventDefault();
    
    gestureState.isPinching = false;
    
    if (currentMode === 'hand') {
      canvas.style.cursor = 'grab';
      if (isDrawing) {
        isDrawing = false;
      }
      return;
    }
    
    if (!isDrawing) return;
    isDrawing = false;
    canvas.style.cursor = 'crosshair';
    saveState();
  }
  
  const brushTypeGroup = document.getElementById('brushTypeGroup');
  const brushesSection = document.getElementById('brushesSection');
  
  function resetViewport() {
    viewport.scale = 1;
    viewport.offsetX = 0;
    viewport.offsetY = 0;
    canvas.style.transform = 'none';
  }
  
  function updateModesSection() {
    const modesContent = document.getElementById('modes-content');
    if (modesContent) {
      modesContent.style.maxHeight = modesContent.scrollHeight + 100 + 'px';
    }
  }
  
  modeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      modeButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const previousMode = currentMode;
      currentMode = this.dataset.mode;
      
      if (previousMode === 'hand' && currentMode !== 'hand') {
        resetViewport();
      }
      
      // Remove colouring mode class when switching away
      if (currentMode !== 'colouring') {
        document.body.classList.remove('colouring-mode');
      }
      
      // Unlock brushes when exiting mandala mode
      if (previousMode === 'mandala' && currentMode !== 'mandala') {
        document.querySelectorAll('.brush-btn').forEach(btn => {
          btn.classList.remove('brush-locked');
          btn.disabled = false;
        });
        // Restore previous brush if saved
        if (window.previousBrushBeforeMandala) {
          setBrush(window.previousBrushBeforeMandala);
          window.previousBrushBeforeMandala = null;
        }
      }
      
      if (currentMode === 'mandala') {
        symmetryGroup.style.display = 'block';
        templateGroup.style.display = 'none';
        if (brushesSection) brushesSection.style.display = 'block';
        if (colouringSection) colouringSection.style.display = 'none';
        canvas.style.cursor = 'crosshair';
        // Lock brush to ink for consistent mandala drawing
        if (currentBrush !== 'ink') {
          window.previousBrushBeforeMandala = currentBrush;
        }
        setBrush('ink');
        // Disable other brush buttons
        document.querySelectorAll('.brush-btn').forEach(btn => {
          if (btn.dataset.brush !== 'ink' && btn.dataset.brush !== 'eraser') {
            btn.classList.add('brush-locked');
            btn.disabled = true;
          }
        });
      } else if (currentMode === 'trace') {
        symmetryGroup.style.display = 'none';
        templateGroup.style.display = 'block';
        if (brushesSection) brushesSection.style.display = 'block';
        if (colouringSection) colouringSection.style.display = 'none';
        canvas.style.cursor = 'crosshair';
      } else if (currentMode === 'hand') {
        symmetryGroup.style.display = 'none';
        templateGroup.style.display = 'none';
        if (brushesSection) brushesSection.style.display = 'none';
        if (colouringSection) colouringSection.style.display = 'none';
        canvas.style.cursor = 'grab';
        mirrorMode = false;
      } else if (currentMode === 'mirror') {
        mirrorMode = true;
        symmetryGroup.style.display = 'none';
        templateGroup.style.display = 'none';
        if (brushesSection) brushesSection.style.display = 'block';
        if (colouringSection) colouringSection.style.display = 'none';
      } else if (currentMode === 'colouring') {
        symmetryGroup.style.display = 'none';
        templateGroup.style.display = 'none';
        if (brushesSection) brushesSection.style.display = 'block';
        if (colouringSection) colouringSection.style.display = 'block';
        canvas.style.cursor = 'crosshair';
        mirrorMode = false;
        document.body.classList.add('colouring-mode');
        // Set colouring-friendly brush defaults
        setBrush('paint');
        brushOpacity = 0.85;
        brushSize = 12;
        if (brushSizeSlider) { brushSizeSlider.value = 12; brushSizeValue.textContent = '12'; }
        if (brushOpacitySlider) { brushOpacitySlider.value = 85; opacityValue.textContent = '85'; }
        resetViewport();
      } else {
        symmetryGroup.style.display = 'none';
        templateGroup.style.display = 'none';
        if (brushesSection) brushesSection.style.display = 'block';
        if (colouringSection) colouringSection.style.display = 'none';
        canvas.style.cursor = 'crosshair';
        mirrorMode = false;
      }
      
      setTimeout(updateModesSection, 10);
    });
  });
  
  colorPicker.addEventListener('input', function(e) {
    e.stopPropagation();
    brushColor = this.value;
    colorLabel.textContent = colorNames[brushColor.toUpperCase()] || 'Custom';
  });
  
  colorPicker.addEventListener('change', function(e) {
    e.stopPropagation();
    brushColor = this.value;
    colorLabel.textContent = colorNames[brushColor.toUpperCase()] || 'Custom';
  });
  
  // Prevent color picker from triggering canvas events
  colorPicker.addEventListener('mousedown', function(e) {
    e.stopPropagation();
  });
  
  // Chakra palette interaction
  const chakraButtons = document.querySelectorAll('.chakra-btn');
  const chakraSwatches = document.getElementById('chakraSwatches');
  
  chakraButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      chakraButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const chakraKey = btn.dataset.chakra;
      const palette = CHAKRA_PALETTES[chakraKey];
      
      chakraSwatches.innerHTML = '';
      
      palette.colours.forEach(colour => {
        const swatch = document.createElement('button');
        swatch.className = 'chakra-swatch';
        swatch.style.backgroundColor = colour;
        swatch.setAttribute('aria-label', `${palette.name} colour`);
        
        swatch.addEventListener('click', () => {
          brushColor = colour;
          colorPicker.value = colour;
          colorLabel.textContent = palette.name;
        });
        
        chakraSwatches.appendChild(swatch);
      });
    });
  });
  
  colorPicker.addEventListener('touchstart', function(e) {
    e.stopPropagation();
  }, { passive: true });
  
  brushSizeSlider.addEventListener('input', function() {
    brushSize = parseInt(this.value);
    brushSizeValue.textContent = brushSize;
  });
  
  window.setBrush = function(type) {
    currentBrush = type;
    document.querySelectorAll('.brush-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.brush === type) {
        btn.classList.add('active');
      }
    });
  };
  
  brushOpacitySlider.addEventListener('input', function() {
    brushOpacity = parseInt(this.value) / 100;
    opacityValue.textContent = this.value;
  });
  
  symmetrySelect.addEventListener('change', function() {
    currentSymmetry = parseInt(this.value);
  });
  
  templateSelect.addEventListener('change', function() {
    if (this.value) {
      currentTemplate = this.value;
      const img = generateMandalaTemplate(this.value);
      img.onload = function() {
        templateImage = img;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        undoStack = [];
        renderTemplate();
        saveState();
      };
      // If already loaded (cached), trigger manually
      if (img.complete) {
        templateImage = img;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        undoStack = [];
        renderTemplate();
        saveState();
      }
    }
  });
  
  // Colouring Page selector
  if (colouringSelect) {
    colouringSelect.addEventListener('change', function() {
      if (!this.value) return;
      currentColouringPage = this.value;
      undoStack = [];
      renderColouringPage(this.value);
    });
  }
  
  // Sacred Stamps event listeners
  if (stampSelect) {
    stampSelect.addEventListener('change', function() {
      currentStamp = this.value || '';
    });
  }

  if (stampSizeSlider) {
    stampSizeSlider.addEventListener('input', function() {
      stampSize = parseInt(this.value, 10);
      if (stampSizeValue) stampSizeValue.textContent = stampSize;
    });
  }

  if (stampRotationSlider) {
    stampRotationSlider.addEventListener('input', function() {
      stampRotation = parseInt(this.value, 10);
      if (stampRotValue) stampRotValue.textContent = stampRotation;
    });
  }

  if (stampFillToggle) {
    stampFillToggle.addEventListener('change', function() {
      stampFill = !!this.checked;
    });
  }

  if (kaleidoscopeToggle) {
    kaleidoscopeToggle.addEventListener('change', function() {
      kaleidoscopeMirror = !!this.checked;
    });
  }
  
  undoBtn.addEventListener('click', function() {
    if (undoStack.length <= 1) return;
    undoStack.pop();
    const state = undoStack[undoStack.length - 1];
    const img = new Image();
    img.onload = function() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      if (templateImage && currentMode === 'trace') {
        renderTemplate();
      }
    };
    img.src = state;
    updateUndoButton();
  });
  
  clearBtn.addEventListener('click', function() {
    if (confirm('Clear all drawing?')) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (templateImage && currentMode === 'trace') {
        renderTemplate();
      }
      undoStack = [];
      saveState();
    }
  });
  
  resetTemplateBtn.addEventListener('click', function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (templateImage && currentMode === 'trace') {
      renderTemplate();
    }
    undoStack = [];
    saveState();
  });
  
  if (resetViewBtn) {
    resetViewBtn.addEventListener('click', function() {
      resetViewport();
    });
  }
  
  downloadBtn.addEventListener('click', function() {
    const link = document.createElement('a');
    link.download = 'soulart-mandala-' + new Date().toISOString().slice(0, 10) + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
  
  // Print my doodle - downloads image then shows Printify button
  window.printMyDoodle = function() {
    const imageData = canvas.toDataURL('image/png');
    const filename = 'soulart-doodle-' + new Date().toISOString().slice(0, 10) + '.png';
    
    // Check if on mobile/iOS - use share API if available
    if (navigator.share && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      // Convert data URL to blob for sharing
      fetch(imageData)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], filename, { type: 'image/png' });
          navigator.share({
            files: [file],
            title: 'SoulArt Doodle'
          }).then(() => {
            showPrintifyModal();
          }).catch(() => {
            // Fallback if share cancelled
            fallbackDownload(imageData, filename);
          });
        });
    } else {
      fallbackDownload(imageData, filename);
    }
  };
  
  function fallbackDownload(imageData, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = imageData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showPrintifyModal();
  }
  
  function showPrintifyModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('printifyModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'printifyModal';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
      modal.innerHTML = `
        <div style="background:#f6f1e8;border-radius:16px;padding:2rem;max-width:400px;width:90%;text-align:center;font-family:Cormorant Garamond,serif;">
          <h3 style="margin:0 0 1rem;color:#3a3a3a;font-size:1.5rem;">Image Saved</h3>
          <p style="color:#6a5a42;margin-bottom:1.5rem;">Your artwork has been downloaded. Now upload it to Printify to order your custom print.</p>
          <a href="https://soulart-studio.printify.me" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f56400,#fa7d19);color:white;padding:1rem 2rem;border-radius:999px;text-decoration:none;font-size:1.1rem;margin-bottom:1rem;">Continue to Printify</a>
          <br><a href="#" onclick="document.getElementById('printifyModal').remove();return false;" style="color:#6a5a42;font-size:0.95rem;">Close</a>
        </div>
      `;
      document.body.appendChild(modal);
    }
  }
  
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  
  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing, { passive: false });
  canvas.addEventListener('touchcancel', stopDrawing, { passive: false });
  
  resizeCanvas();
  saveState();
  
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 250);
  });

  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const trackSelect = document.getElementById('trackSelect');
  const volumeSlider = document.getElementById('volumeSlider');
  const nowPlaying = document.getElementById('nowPlaying');
  const trackNameDisplay = document.getElementById('trackName');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const playPauseLabel = document.getElementById('playPauseLabel');
  
  let audioPlayer = null;
  let isPlaying = false;
  let currentTrack = '432hz';
  
  const trackFiles = {
    '432hz': '/static/audio/432hz-meditation-355839.mp3',
    'drums': '/static/audio/888peaceful-morning-drums-in-paradise-185430.mp3',
    'alpha': '/static/audio/alpha-music-432hz-the-third-314870.mp3',
    'calm': '/static/audio/calm-meditation-with-nature-sound-357943 copy.mp3',
    'handpan': '/static/audio/handpan-soundscape-432-hz-396231.mp3',
    'serenity': '/static/audio/serenity-waves-zen-meditation-247329.mp3',
    'chakras': '/static/audio/opening-chakras-with-water-intro-outro-fx-395549.mp3',
    'chakrabalance': '/static/audio/chakra-balance.mp3',
    'healing': '/static/audio/healing-frequency.mp3',
    'tibetan': '/static/audio/tibetan-bowls.mp3',
    'peaceful': '/static/audio/peaceful-meditation.mp3',
    'nature': '/static/audio/nature-sounds.mp3'
  };
  
  const trackNames = {
    '432hz': '432Hz Meditation',
    'drums': 'Peaceful Morning Drums',
    'alpha': 'Alpha Music 432Hz',
    'calm': 'Calm Nature Sounds',
    'handpan': 'Handpan Soundscape',
    'serenity': 'Serenity Waves Zen',
    'chakras': 'Opening Chakras',
    'chakrabalance': 'Chakra Balance',
    'healing': 'Healing Frequency',
    'tibetan': 'Tibetan Bowls',
    'peaceful': 'Peaceful Meditation',
    'nature': 'Nature Sounds'
  };
  
  function initAudio() {
    if (!audioPlayer) {
      audioPlayer = new Audio();
      audioPlayer.loop = true;
      audioPlayer.volume = volumeSlider ? volumeSlider.value / 100 : 0.5;
    }
  }
  
  function updateNowPlaying() {
    if (trackNameDisplay) {
      trackNameDisplay.textContent = trackNames[currentTrack] || currentTrack;
    }
  }
  
  function startMusic() {
    initAudio();
    
    const trackUrl = trackFiles[currentTrack];
    if (audioPlayer.src !== window.location.origin + trackUrl) {
      audioPlayer.src = trackUrl;
    }
    
    audioPlayer.play().then(() => {
      isPlaying = true;
      musicToggleBtn.classList.add('playing');
      if (playPauseLabel) playPauseLabel.textContent = 'Stop';
      if (playPauseIcon) playPauseIcon.textContent = '⏹';
      if (nowPlaying) nowPlaying.style.display = 'flex';
      updateNowPlaying();
    }).catch(err => {
      console.log('Audio play failed:', err);
      alert('Please click the Play button again to start music.');
    });
  }
  
  function stopMusic() {
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    }
    isPlaying = false;
    musicToggleBtn.classList.remove('playing');
    if (playPauseLabel) playPauseLabel.textContent = 'Play';
    if (playPauseIcon) playPauseIcon.textContent = '▶';
    if (nowPlaying) nowPlaying.style.display = 'none';
  }
  
  if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', function() {
      if (isPlaying) {
        stopMusic();
      } else {
        startMusic();
      }
    });
  }
  
  if (trackSelect) {
    trackSelect.addEventListener('change', function() {
      currentTrack = this.value;
      updateNowPlaying();
      if (isPlaying) {
        audioPlayer.src = trackFiles[currentTrack];
        audioPlayer.play();
      }
    });
  }
  
  if (volumeSlider) {
    volumeSlider.addEventListener('input', function() {
      if (audioPlayer) {
        audioPlayer.volume = this.value / 100;
      }
    });
  }

  // Save to Journal functionality
  const saveToJournalBtn = document.getElementById('saveToJournalBtn');
  const saveJournalModal = document.getElementById('saveJournalModal');
  const journalDateEl = document.getElementById('journalDate');
  const journalNoteEl = document.getElementById('journalNote');
  const confirmSaveJournal = document.getElementById('confirmSaveJournal');
  const saveJournalMessage = document.getElementById('saveJournalMessage');

  function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  }

  window.openSaveJournalModal = function() {
    if (saveJournalModal) {
      journalDateEl.textContent = formatDate(new Date());
      journalNoteEl.value = '';
      saveJournalMessage.textContent = '';
      saveJournalMessage.className = 'modal-message';
      saveJournalModal.style.display = 'flex';
    }
  };

  window.closeSaveJournalModal = function() {
    if (saveJournalModal) {
      saveJournalModal.style.display = 'none';
    }
  };

  if (saveToJournalBtn) {
    saveToJournalBtn.addEventListener('click', function() {
      // Check if user is logged in first
      fetch('/api/auth/check')
        .then(r => r.json())
        .then(data => {
          if (data.authenticated) {
            openSaveJournalModal();
          } else {
            alert('Please log in to save your doodle to your Sacred Journal.');
            window.location.href = '../login.html';
          }
        })
        .catch(() => {
          alert('Please log in to save your doodle to your Sacred Journal.');
          window.location.href = '../login.html';
        });
    });
  }

  if (confirmSaveJournal) {
    confirmSaveJournal.addEventListener('click', function() {
      const note = journalNoteEl.value.trim();
      const imageData = canvas.toDataURL('image/png');

      saveJournalMessage.textContent = 'Saving...';
      saveJournalMessage.className = 'modal-message';

      fetch('/api/journal/save-doodle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          note: note
        })
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            saveJournalMessage.textContent = 'Saved to your Sacred Journal!';
            saveJournalMessage.className = 'modal-message success';
            setTimeout(() => {
              closeSaveJournalModal();
            }, 1500);
          } else {
            saveJournalMessage.textContent = data.error || 'Failed to save. Please try again.';
            saveJournalMessage.className = 'modal-message error';
          }
        })
        .catch(err => {
          saveJournalMessage.textContent = 'Failed to save. Please try again.';
          saveJournalMessage.className = 'modal-message error';
        });
    });
  }

  // Close modal on overlay click
  if (saveJournalModal) {
    saveJournalModal.addEventListener('click', function(e) {
      if (e.target === saveJournalModal) {
        closeSaveJournalModal();
      }
    });
  }
});