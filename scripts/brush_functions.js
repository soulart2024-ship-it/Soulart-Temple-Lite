/*
 * Optimized Brush Engine for SoulArt Doodle Studio
 *
 * Realistic brush functions balanced for performance:
 * Pencil, Ink, Soft Brush, Watercolour, Crayon, and Alcohol Ink.
 */

function applyOpacity(colour, opacity) {
  let r, g, b;
  if (colour.startsWith('#')) {
    const hex = colour.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    const match = colour.match(/\d+/g);
    if (match) {
      [r, g, b] = match.map(Number);
    } else {
      r = g = b = 0;
    }
  }
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, opacity))})`;
}

function hexToRgb(colour) {
  let r, g, b;
  if (colour.startsWith('#')) {
    const hex = colour.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    const match = colour.match(/\d+/g);
    if (match) {
      [r, g, b] = match.map(Number);
    } else {
      r = g = b = 0;
    }
  }
  return { r, g, b };
}

// Pencil: Realistic graphite with paper grain - optimized
function pencilBrush(ctx, from, to, { colour, size, opacity }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  
  // Limit steps for performance
  const steps = Math.min(Math.ceil(dist / 2), 15);
  
  // Fixed particle count regardless of size
  const particles = Math.min(Math.ceil(size * 0.8), 8);
  
  for (let i = 0; i < steps; i++) {
    const t = i / Math.max(steps, 1);
    const x = from.x + dx * t;
    const y = from.y + dy * t;
    
    for (let p = 0; p < particles; p++) {
      if (Math.random() > 0.6) continue;
      
      const spreadX = (Math.random() - 0.5) * size * 0.7;
      const spreadY = (Math.random() - 0.5) * size * 0.7;
      
      const px = x + spreadX;
      const py = y + spreadY;
      
      const darkness = opacity * (0.5 + Math.random() * 0.5);
      ctx.fillStyle = applyOpacity(colour, darkness);
      
      const particleSize = 0.8 + Math.random() * 1.2;
      ctx.fillRect(px, py, particleSize, particleSize);
    }
  }
}

// Ink: Pressure-sensitive smooth strokes
function inkBrush(ctx, from, to, { colour, size, opacity }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  
  const velocity = Math.min(dist / 8, 1);
  const pressureWidth = size * (0.7 + (1 - velocity) * 0.5);
  
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.strokeStyle = applyOpacity(colour, opacity);
  ctx.lineWidth = pressureWidth;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  
  // Subtle bleeding edge
  if (size > 4) {
    ctx.strokeStyle = applyOpacity(colour, opacity * 0.12);
    ctx.lineWidth = pressureWidth * 1.25;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
  
  ctx.restore();
}

// Soft brush: Airbrush effect - optimized with fewer gradients
function softBrush(ctx, from, to, { colour, size, opacity }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  
  // Fewer steps, larger spacing
  const steps = Math.min(Math.ceil(dist / (size * 0.5)), 8);
  
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(steps, 1);
    const x = from.x + dx * t;
    const y = from.y + dy * t;
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, applyOpacity(colour, opacity * 0.35));
    gradient.addColorStop(0.5, applyOpacity(colour, opacity * 0.15));
    gradient.addColorStop(1, applyOpacity(colour, 0));
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
  }
}

// Watercolour: Wet media effect - optimized
function watercolourBrush(ctx, from, to, { colour, size, opacity }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  
  // Fewer steps for performance
  const steps = Math.min(Math.ceil(dist / (size * 0.6)), 6);
  
  const rgb = hexToRgb(colour);
  
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(steps, 1);
    const x = from.x + dx * t + (Math.random() - 0.5) * size * 0.15;
    const y = from.y + dy * t + (Math.random() - 0.5) * size * 0.15;
    
    const blobSize = size * (0.8 + Math.random() * 0.4);
    const wetness = 0.35 + Math.random() * 0.3;
    
    // Slight color variation
    const colorVar = 12;
    const r = Math.max(0, Math.min(255, rgb.r + (Math.random() - 0.5) * colorVar));
    const g = Math.max(0, Math.min(255, rgb.g + (Math.random() - 0.5) * colorVar));
    const b = Math.max(0, Math.min(255, rgb.b + (Math.random() - 0.5) * colorVar));
    const variedColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, blobSize);
    gradient.addColorStop(0, applyOpacity(variedColor, opacity * wetness * 0.5));
    gradient.addColorStop(0.5, applyOpacity(variedColor, opacity * wetness * 0.25));
    gradient.addColorStop(1, applyOpacity(variedColor, 0));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, blobSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Occasional bloom (reduced frequency)
    if (Math.random() < 0.15) {
      const bloomX = x + (Math.random() - 0.5) * blobSize * 1.5;
      const bloomY = y + (Math.random() - 0.5) * blobSize * 1.5;
      const bloomSize = blobSize * 0.3;
      
      const bloomGrad = ctx.createRadialGradient(bloomX, bloomY, 0, bloomX, bloomY, bloomSize);
      bloomGrad.addColorStop(0, applyOpacity(variedColor, opacity * 0.12));
      bloomGrad.addColorStop(1, applyOpacity(variedColor, 0));
      
      ctx.fillStyle = bloomGrad;
      ctx.beginPath();
      ctx.arc(bloomX, bloomY, bloomSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Crayon: Waxy texture with paper grain - optimized
function crayonBrush(ctx, from, to, { colour, size, opacity }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  
  // Fewer steps
  const steps = Math.min(Math.ceil(dist / 2), 12);
  
  // Fixed stroke count
  const strokes = Math.min(Math.ceil(size * 0.6), 6);
  
  for (let i = 0; i < steps; i++) {
    const t = i / Math.max(steps, 1);
    const x = from.x + dx * t;
    const y = from.y + dy * t;
    
    for (let s = 0; s < strokes; s++) {
      if (Math.random() > 0.7) continue;
      
      const spreadX = (Math.random() - 0.5) * size * 0.8;
      const spreadY = (Math.random() - 0.5) * size * 0.8;
      
      const sx = x + spreadX;
      const sy = y + spreadY;
      
      const waxOpacity = opacity * (0.55 + Math.random() * 0.45);
      ctx.fillStyle = applyOpacity(colour, waxOpacity);
      
      const markWidth = 1.5 + Math.random() * 2.5;
      const markHeight = 1 + Math.random() * 2;
      
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle + (Math.random() - 0.5) * 0.2);
      ctx.fillRect(-markWidth/2, -markHeight/2, markWidth, markHeight);
      ctx.restore();
    }
  }
}

// Alcohol ink: Organic blooms - optimized
function alcoholInkBrush(ctx, from, to, { colour, size, opacity }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  
  // Fewer steps
  const steps = Math.min(Math.ceil(dist / size), 5);
  
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(steps, 1);
    const x = from.x + dx * t;
    const y = from.y + dy * t;
    
    const blobSize = size * (0.7 + Math.random() * 0.5);
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, blobSize);
    gradient.addColorStop(0, applyOpacity(colour, opacity * 0.85));
    gradient.addColorStop(0.4, applyOpacity(colour, opacity * 0.5));
    gradient.addColorStop(1, applyOpacity(colour, 0));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, blobSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Occasional tendril (reduced)
    if (Math.random() < 0.2) {
      const tendrilAngle = Math.random() * Math.PI * 2;
      const tendrilLength = blobSize * 1.2;
      const tendrilX = x + Math.cos(tendrilAngle) * tendrilLength;
      const tendrilY = y + Math.sin(tendrilAngle) * tendrilLength;
      const tendrilSize = blobSize * 0.35;
      
      const tGrad = ctx.createRadialGradient(tendrilX, tendrilY, 0, tendrilX, tendrilY, tendrilSize);
      tGrad.addColorStop(0, applyOpacity(colour, opacity * 0.4));
      tGrad.addColorStop(1, applyOpacity(colour, 0));
      
      ctx.fillStyle = tGrad;
      ctx.beginPath();
      ctx.arc(tendrilX, tendrilY, tendrilSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Occasional splatter (reduced)
    if (Math.random() < 0.15) {
      const splatAngle = Math.random() * Math.PI * 2;
      const splatDist = blobSize * 1.5;
      const splatX = x + Math.cos(splatAngle) * splatDist;
      const splatY = y + Math.sin(splatAngle) * splatDist;
      const splatSize = blobSize * 0.25;
      
      const splatGrad = ctx.createRadialGradient(splatX, splatY, 0, splatX, splatY, splatSize);
      splatGrad.addColorStop(0, applyOpacity(colour, opacity * 0.5));
      splatGrad.addColorStop(1, applyOpacity(colour, 0));
      
      ctx.fillStyle = splatGrad;
      ctx.beginPath();
      ctx.arc(splatX, splatY, splatSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export {
  applyOpacity,
  pencilBrush,
  inkBrush,
  softBrush,
  watercolourBrush,
  crayonBrush,
  alcoholInkBrush,
};
