// ANILyfe Master APNG & Static Asset Generator
// Generates seamless APNG loops for all 17 site assets conforming to the strict anime palette and < 1 MB limit.
const fs = require('fs');
const path = require('path');
const { Canvas2D, encodeAPNG, makeChunk } = require('./apng-engine');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Strict Color Tokens
const NAVY  = [8, 31, 92];       // #081F5C
const DEEP  = [7, 27, 82];       // #071B52
const BLUE  = [51, 78, 172];     // #334EAC
const MID   = [112, 139, 209];    // #708BD1
const SKY   = [159, 184, 238];    // #9FB8EE
const LIGHT = [208, 227, 255];   // #D0E3FF
const VL    = [231, 241, 255];   // #E7F1FF
const WHITE = [255, 255, 255];   // #FFFFFF
const GLOW  = [127, 176, 255];   // #7FB0FF
const GOLD  = [233, 185, 73];    // #E9B949
const BLUSH = [255, 170, 190];

// Cel-shaded banded glow for crisp anime aesthetic & high Deflate compression
function drawCelGlow(canvas, cx, cy, r, color, rings = 3, maxAlpha = 140) {
  const [cr, cg, cb] = color;
  for (let i = rings; i >= 1; i--) {
    const ringR = (r * i) / rings;
    const alpha = Math.round((maxAlpha * (rings - i + 1)) / (rings + 1));
    canvas.fillCircle(cx, cy, ringR, [cr, cg, cb, alpha]);
  }
}

// Draw ANILyfe Mascot
function drawMascot(canvas, cx, cy, size, t = 0, opts = {}) {
  const {
    forceBlink = false,
    noBlink = false,
    visor = false,
    nod = 0,
    headTilt = 0,
    armAdjust = 0,
    leanX = 0,
    antennaGlow = true
  } = opts;

  // 1. Subtle float: 6px vertical oscillation
  const floatDy = -6 * Math.sin(2 * Math.PI * t) + (nod * Math.sin(2 * Math.PI * t));
  // 2. Hair sway
  const hairSway = 2.5 * Math.sin(2 * Math.PI * t);
  const hairSway2 = 1.5 * Math.cos(2 * Math.PI * t);
  // 3. Blink factor
  let blink = 0;
  if (forceBlink) {
    blink = 1.0;
  } else if (!noBlink && t >= 0.65 && t <= 0.75) {
    blink = Math.sin(((t - 0.65) / 0.10) * Math.PI);
  }
  // 4. Antenna pulse
  const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);

  const s = size;
  const mCanvas = new Canvas2D(Math.ceil(s * 1.5), Math.ceil(s * 1.5));
  const ox = Math.floor(s * 0.25) + Math.round(leanX * s);
  const oy = Math.floor(s * 0.25) + Math.round(headTilt * s);

  // Back hair with subtle sway
  const hairPts = [
    [ox + 0.04 * s + hairSway, oy + 0.40 * s],
    [ox + 0.10 * s - hairSway, oy + 0.08 * s],
    [ox + 0.30 * s + hairSway2, oy + 0.22 * s],
    [ox + 0.42 * s, oy - 0.02 * s - hairSway2 * 0.5],
    [ox + 0.55 * s - hairSway, oy + 0.20 * s],
    [ox + 0.74 * s + hairSway, oy + 0.00 * s],
    [ox + 0.84 * s - hairSway2, oy + 0.22 * s],
    [ox + 0.98 * s + hairSway, oy + 0.12 * s],
    [ox + 0.96 * s, oy + 0.42 * s]
  ];
  mCanvas.fillPolygon(hairPts, [...NAVY, 255]);

  // Face rounded rectangle
  mCanvas.fillRoundedRect(
    ox + 0.08 * s,
    oy + 0.18 * s,
    0.84 * s,
    0.78 * s,
    0.26 * s,
    [...VL, 255],
    [...BLUE, 255],
    Math.max(2, Math.round(0.035 * s))
  );

  // Fringe bangs
  const fringePts = [
    [ox + 0.08 * s, oy + 0.34 * s],
    [ox + 0.20 * s + hairSway * 0.6, oy + 0.16 * s],
    [ox + 0.30 * s, oy + 0.40 * s],
    [ox + 0.44 * s + hairSway2 * 0.6, oy + 0.14 * s],
    [ox + 0.56 * s, oy + 0.40 * s],
    [ox + 0.70 * s - hairSway * 0.6, oy + 0.16 * s],
    [ox + 0.80 * s, oy + 0.40 * s],
    [ox + 0.92 * s, oy + 0.30 * s],
    [ox + 0.92 * s, oy + 0.20 * s],
    [ox + 0.60 * s, oy + 0.10 * s],
    [ox + 0.30 * s, oy + 0.10 * s],
    [ox + 0.10 * s, oy + 0.20 * s]
  ];
  mCanvas.fillPolygon(fringePts, [...BLUE, 255]);

  // Eyes
  for (const ex of [0.30, 0.70]) {
    const eyeCx = ox + ex * s;
    const eyeCy = oy + 0.59 * s;

    if (blink > 0.5) {
      mCanvas.drawArc(eyeCx, eyeCy - 0.02 * s, 0.09 * s, 0.05 * s, 20, 160, [...NAVY, 255], Math.max(3, Math.round(0.03 * s)));
    } else {
      const openRatio = Math.max(0.2, 1 - blink);
      const ry = 0.13 * s * openRatio;
      mCanvas.fillEllipse(eyeCx, eyeCy, 0.095 * s, ry, [...NAVY, 255]);
      mCanvas.fillEllipse(eyeCx, eyeCy + 0.01 * s, 0.075 * s, ry * 0.8, [...BLUE, 255]);
      mCanvas.fillEllipse(eyeCx - 0.025 * s, eyeCy - ry * 0.35, 0.025 * s, 0.03 * s * openRatio, [...WHITE, 255]);
      mCanvas.fillEllipse(eyeCx + 0.025 * s, eyeCy + ry * 0.35, 0.02 * s, 0.02 * s * openRatio, [...SKY, 255]);
    }
  }

  // Blush
  mCanvas.fillEllipse(ox + 0.19 * s, oy + 0.73 * s, 0.06 * s, 0.035 * s, [...BLUSH, 130]);
  mCanvas.fillEllipse(ox + 0.81 * s, oy + 0.73 * s, 0.06 * s, 0.035 * s, [...BLUSH, 130]);

  // Mouth
  mCanvas.drawArc(ox + 0.50 * s, oy + 0.74 * s, 0.08 * s, 0.06 * s, 20, 160, [...NAVY, 255], Math.max(2, Math.round(0.025 * s)));

  // Gold accent on collar/antenna base
  mCanvas.fillCircle(ox + 0.50 * s, oy + 0.88 * s, 0.025 * s, [...GOLD, 255]);

  // Visor
  if (visor) {
    mCanvas.fillRoundedRect(
      ox + 0.14 * s,
      oy + 0.44 * s,
      0.72 * s,
      0.26 * s,
      0.10 * s,
      [...GLOW, 110],
      [...WHITE, 230],
      Math.max(1, Math.round(0.02 * s))
    );
  }

  // Antenna spark lights
  if (antennaGlow) {
    const sparkRadius = (0.026 + 0.008 * pulse) * s;
    for (const [ax, ay] of [[0.5, 0.0], [0.22, 0.04], [0.78, 0.04]]) {
      const scx = ox + ax * s;
      const scy = oy + ay * s;
      drawCelGlow(mCanvas, scx, scy, sparkRadius * 2.2, GLOW, 2, Math.round(140 + 60 * pulse));
      mCanvas.fillCircle(scx, scy, sparkRadius, [...WHITE, 255]);
    }
  }

  if (armAdjust > 0) {
    // Subtle arm adjustment
    mCanvas.drawLine(ox + 0.88 * s, oy + 0.75 * s, ox + 0.98 * s, oy + 0.65 * s - armAdjust * 6, [...BLUE, 255], 4);
    mCanvas.fillCircle(ox + 0.98 * s, oy + 0.65 * s - armAdjust * 6, 0.04 * s, [...VL, 255]);
  }

  const finalX = Math.round(cx - mCanvas.width / 2);
  const finalY = Math.round(cy - mCanvas.height / 2 + floatDy);
  canvas.composite(mCanvas, finalX, finalY);
}

function grid(canvas, step = 40, alpha = 20) {
  for (let x = 0; x < canvas.width; x += step) {
    canvas.drawLine(x, 0, x, canvas.height, [...LIGHT, alpha], 1);
  }
  for (let y = 0; y < canvas.height; y += step) {
    canvas.drawLine(0, y, canvas.width, y, [...LIGHT, alpha], 1);
  }
}

function skyline(canvas, base = 0.82, t = 0) {
  const W = canvas.width, H = canvas.height;
  const col = [6, 22, 70];
  let x = 0;
  let seed = 1234;
  function rand() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  while (x < W) {
    const w = 30 + Math.floor(rand() * 50);
    const h = Math.floor(H * 0.10 + rand() * (H * 0.20));
    const top = Math.floor(H * base) - h;
    canvas.fillRoundedRect(x, top, w, H - top, 0, [...col, 255]);
    let winIdx = 0;
    for (let wy = top + 10; wy < H - 15; wy += 18) {
      for (let wx = x + 6; wx < x + w - 6; wx += 14) {
        winIdx++;
        if (rand() < 0.35) {
          const twinkle = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t + winIdx * 0.15));
          canvas.fillRoundedRect(wx, wy, 5, 6, 2, [...GLOW, Math.round(70 + 80 * twinkle)]);
        }
      }
    }
    x += w + 4;
  }
}

function stars(canvas, count = 25, t = 0) {
  let seed = 4321;
  function rand() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  for (let i = 0; i < count; i++) {
    const sx = Math.floor(rand() * canvas.width);
    const sy = Math.floor(rand() * (canvas.height * 0.65));
    const shimmer = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t + i * 0.2));
    canvas.fillCircle(sx, sy, 1.5, [...WHITE, Math.round(90 + 150 * shimmer)]);
  }
}

function saveAPNG(frames, width, height, fps, filename) {
  const apngBuf = encodeAPNG(frames, width, height, fps);
  fs.writeFileSync(path.join(OUT_DIR, filename), apngBuf);
  console.log(`Saved ${filename} (${(apngBuf.length / 1024).toFixed(1)} KB) - ${width}x${height}`);
}

// 1. loader-mascot.png (512x512, transparent background, 3s loop)
function genLoaderMascot() {
  const W = 512, H = 512, FPS = 10, TOTAL = 30;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, 256, 256, 170 + 20 * pulse, GLOW, 3, Math.round(90 + 30 * pulse));
    drawMascot(canvas, 256, 256, 340, t);
    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'loader-mascot.png');
}

// 2. loader-mascot-blink.png (512x512, transparent background, 3s loop, eyes stay closed)
function genLoaderMascotBlink() {
  const W = 512, H = 512, FPS = 10, TOTAL = 30;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, 256, 256, 170 + 20 * pulse, GLOW, 3, Math.round(90 + 30 * pulse));
    drawMascot(canvas, 256, 256, 340, t, { forceBlink: true });
    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'loader-mascot-blink.png');
}

// 3. homepage.png (16:9, 5s loop)
function genHomepage() {
  const W = 560, H = 315, FPS = 5, TOTAL = 25;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient(DEEP, [13, 58, 156]);
    grid(canvas, 32, 16);
    skyline(canvas, 0.82, t);
    stars(canvas, 24, t);

    // One faint shooting star crossing sky
    if (t >= 0.3 && t <= 0.55) {
      const stProg = (t - 0.3) / 0.25;
      const sx = Math.round(W * 0.9 - stProg * (W * 0.35));
      const sy = Math.round(H * 0.1 + stProg * (H * 0.25));
      canvas.drawLine(sx, sy, sx + 22, sy - 16, [...WHITE, Math.round(180 * (1 - Math.abs(stProg - 0.5) * 2))], 2);
    }

    // Floating holographic product cards
    const cardFloat = 4 * Math.cos(2 * Math.PI * t);
    const cards = [
      [W * 0.36, H * 0.16 + cardFloat, W * 0.16, H * 0.22],
      [W * 0.34, H * 0.52 - cardFloat, W * 0.14, H * 0.20],
      [W * 0.86, H * 0.28 - cardFloat, W * 0.11, H * 0.18],
      [W * 0.82, H * 0.60 + cardFloat, W * 0.12, H * 0.18]
    ];
    for (const [px, py, pw, ph] of cards) {
      canvas.fillRoundedRect(px, py, pw, ph, 10, [...WHITE, 35], [...LIGHT, 80], 1.5);
      canvas.fillRoundedRect(px + 6, py + 6, pw - 12, ph - 24, 5, [...LIGHT, 55]);
      canvas.fillRoundedRect(px + 6, py + ph - 15, (pw - 12) * 0.6, 6, 2, [...WHITE, 100]);
    }

    const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, W * 0.66, H * 0.50, 115 + 12 * pulse, GLOW, 3, Math.round(85 + 20 * pulse));
    drawMascot(canvas, Math.round(W * 0.66), Math.round(H * 0.48), 195, t);

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'homepage.png');
}

// 4. admin.png (16:9, 4s loop: mascot blinks, holographic charts update, indicator lights pulse, visor glow)
function genAdmin() {
  const W = 560, H = 315, FPS = 5, TOTAL = 20;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient([5, 20, 60], [10, 46, 128]);
    grid(canvas, 30, 16);

    // Holographic control room panels
    canvas.fillRoundedRect(35, 35, W * 0.44, H * 0.82, 14, [...DEEP, 200], [...LIGHT, 90], 1.5);

    // Updating line chart
    const pts = [];
    for (let c = 0; c < 7; c++) {
      const cx = 50 + c * 30;
      const chartProg = Math.sin(2 * Math.PI * (t + c * 0.12));
      const cy = Math.round(120 - chartProg * 22 - c * 4);
      pts.push([cx, cy]);
    }
    for (let p = 0; p < pts.length - 1; p++) {
      canvas.drawLine(pts[p][0], pts[p][1], pts[p + 1][0], pts[p + 1][1], [...GLOW, 240], 2.5);
      canvas.fillCircle(pts[p][0], pts[p][1], 3, [...WHITE, 255]);
    }

    // Updating bar chart
    for (let b = 0; b < 6; b++) {
      const bx = 50 + b * 36;
      const bh = Math.round(30 + 18 * Math.sin(2 * Math.PI * (t + b * 0.18)));
      canvas.fillRoundedRect(bx, 230 - bh, 20, bh, 4, [...BLUE, 220], [...SKY, 180], 1);
    }

    // Indicator pulsing lights
    const indPulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
    canvas.fillCircle(W * 0.44, 52, 4, [...GOLD, Math.round(150 + 105 * indPulse)]);
    canvas.fillCircle(W * 0.44 + 12, 52, 4, [...GLOW, Math.round(150 + 105 * (1 - indPulse))]);

    // Mascot with glowing visor
    drawCelGlow(canvas, W * 0.72, H * 0.50, 115, GLOW, 3, 90);
    drawMascot(canvas, Math.round(W * 0.72), Math.round(H * 0.48), 195, t, { visor: true });

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'admin.png');
}

// 5. seller.png (16:9, 4s loop: welcoming nod, floating blank price tags, storefront glow)
function genSeller() {
  const W = 560, H = 315, FPS = 5, TOTAL = 20;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient(DEEP, [15, 50, 140]);
    grid(canvas, 32, 16);
    skyline(canvas, 0.86, t);

    // Floating price tags
    const tagBob = 4 * Math.sin(2 * Math.PI * t);
    const tags = [
      [50, 80 + tagBob, 70, 88],
      [140, 120 - tagBob, 80, 96],
      [235, 70 + tagBob, 65, 82]
    ];
    for (const [tx, ty, tw, th] of tags) {
      canvas.fillRoundedRect(tx, ty, tw, th, 9, [...WHITE, 40], [...LIGHT, 100], 1.5);
      canvas.fillCircle(tx + tw / 2, ty + 12, 3.5, [...WHITE, 200]);
      canvas.fillRoundedRect(tx + 10, ty + 30, tw - 20, 9, 3, [...GOLD, 180]);
      canvas.fillRoundedRect(tx + 10, ty + 48, (tw - 20) * 0.7, 7, 2.5, [...LIGHT, 120]);
    }

    // Storefront glowing counter
    canvas.fillRoundedRect(W * 0.55, H * 0.72, W * 0.40, H * 0.24, 10, [...BLUE, 180], [...SKY, 200], 2);

    const nodAmount = 3 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, W * 0.75, H * 0.48, 105, GLOW, 3, 90);
    drawMascot(canvas, Math.round(W * 0.75), Math.round(H * 0.46), 185, t, { nod: nodAmount });

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'seller.png');
}

// 6. auth.png (5:6 portrait, 4s loop: glowing door pulses, light particles drift outward)
function genAuth() {
  const W = 320, H = 384, FPS = 5, TOTAL = 20;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient([10, 40, 120], BLUE);
    grid(canvas, 28, 18);
    stars(canvas, 18, t);

    // Gateway arch & glowing door
    const doorPulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, W * 0.5, H * 0.45, 120 + 16 * doorPulse, GLOW, 3, Math.round(100 + 30 * doorPulse));
    canvas.fillRoundedRect(W * 0.28, H * 0.20, W * 0.44, H * 0.65, 26, [...VL, 200], [...WHITE, 255], 2.5);
    canvas.fillRoundedRect(W * 0.33, H * 0.25, W * 0.34, H * 0.60, 18, [...LIGHT, 240]);

    // Light particles drifting outward
    for (let p = 0; p < 8; p++) {
      const pProg = (t + p * 0.125) % 1.0;
      const pAngle = p * (Math.PI / 4);
      const px = Math.round(W * 0.5 + Math.cos(pAngle) * (pProg * 105));
      const py = Math.round(H * 0.45 + Math.sin(pAngle) * (pProg * 105));
      canvas.fillCircle(px, py, 2.5, [...WHITE, Math.round(220 * (1 - pProg))]);
    }

    drawMascot(canvas, Math.round(W * 0.5), Math.round(H * 0.52), 195, t);

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'auth.png');
}

// 7. marketplace.png (16:5, 5s loop: shelves drift, soft glints pass, mascot blinks)
function genMarketplace() {
  const W = 560, H = 175, FPS = 5, TOTAL = 25;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient(DEEP, [15, 50, 140]);
    grid(canvas, 28, 14);
    skyline(canvas, 0.90, t);

    // Staggered floating shelves
    for (let s = 0; s < 4; s++) {
      const sBob = 3 * Math.sin(2 * Math.PI * (t + s * 0.25));
      const sx = 35 + s * 100;
      const sy = 35 + (s % 2) * 20 + sBob;
      canvas.fillRoundedRect(sx, sy, 82, 95, 9, [...WHITE, 40], [...LIGHT, 110], 1.5);
      // Soft glint sweep
      const glintX = sx + ((t + s * 0.2) % 1.0) * 82;
      canvas.drawLine(glintX, sy + 5, glintX + 12, sy + 90, [...WHITE, 90], 1.5);
      canvas.fillCircle(sx + 41, sy + 38, 15, [...SKY, 140]);
      canvas.fillRoundedRect(sx + 16, sy + 68, 48, 7, 2.5, [...GOLD, 200]);
    }

    drawCelGlow(canvas, W * 0.82, H * 0.48, 70, GLOW, 2, 90);
    drawMascot(canvas, Math.round(W * 0.82), Math.round(H * 0.48), 130, t);

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'marketplace.png');
}

// 8. checkout.png (5:3, 3s loop: holographic padlock pulses, shield shimmers, package floats)
function genCheckout() {
  const W = 450, H = 270, FPS = 6, TOTAL = 18;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient(DEEP, [15, 55, 150]);
    grid(canvas, 30, 18);

    // Floating package & padlock
    const pkgFloat = 4 * Math.sin(2 * Math.PI * t);
    const lockPulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, 140, 135 + pkgFloat, 90 + 15 * lockPulse, GLOW, 3, Math.round(100 + 30 * lockPulse));

    // Shield
    canvas.fillRoundedRect(80, 75 + pkgFloat, 120, 120, 20, [...VL, 210], [...BLUE, 255], 3);
    // Padlock icon in gold
    canvas.fillRoundedRect(120, 130 + pkgFloat, 40, 35, 6, [...GOLD, 255]);
    canvas.drawArc(140, 120 + pkgFloat, 14, 16, 180, 360, [...WHITE, 255], 4);

    drawMascot(canvas, Math.round(W * 0.72), Math.round(H * 0.50), 180, t);

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'checkout.png');
}

// 9. 404.png (10:7, 4s loop: mascot tilts head searching, glowing map flickers, stars twinkle)
function gen404() {
  const W = 400, H = 280, FPS = 6, TOTAL = 24;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient(DEEP, [10, 30, 90]);
    grid(canvas, 32, 16);
    stars(canvas, 25, t);

    // Glowing flickering radar/map
    const mapFlicker = 0.5 + 0.5 * Math.sin(2 * Math.PI * t * 2);
    drawCelGlow(canvas, W * 0.5, H * 0.48, 120, GLOW, 3, Math.round(70 + 30 * mapFlicker));
    canvas.drawArc(W * 0.5, H * 0.48, 70, 70, 0, 360, [...LIGHT, Math.round(80 + 40 * mapFlicker)], 2);
    canvas.drawArc(W * 0.5, H * 0.48, 45, 45, 0, 360, [...SKY, Math.round(100 + 40 * mapFlicker)], 1.5);

    // Head tilt search angle
    const headTilt = 0.02 * Math.sin(2 * Math.PI * t);
    drawMascot(canvas, Math.round(W * 0.5), Math.round(H * 0.48), 190, t, { headTilt });

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, '404.png');
}

// 10. empty.png (4:3, 3s loop: mascot leans in slightly and back, glow breathes)
function genEmpty() {
  const W = 400, H = 300, FPS = 6, TOTAL = 18;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient([16, 52, 138], BLUE);
    grid(canvas, 32, 16);

    // Empty display box
    const breathe = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, W * 0.5, H * 0.52, 100 + 15 * breathe, GLOW, 3, Math.round(80 + 30 * breathe));
    canvas.fillRoundedRect(W * 0.22, H * 0.32, W * 0.56, H * 0.48, 18, [...WHITE, 40], [...LIGHT, 120], 2);

    const leanX = 0.02 * Math.sin(2 * Math.PI * t);
    drawMascot(canvas, Math.round(W * 0.5), Math.round(H * 0.46), 180, t, { leanX });

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'empty.png');
}

// 11. splash.png (9:16 phone portrait, 6s loop: mascot floats with pulsing aura, light streaks)
function genSplash() {
  const W = 270, H = 480, FPS = 5, TOTAL = 30;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient([5, 18, 56], [13, 58, 156]);
    grid(canvas, 24, 18);
    skyline(canvas, 0.88, t);
    stars(canvas, 20, t);

    // Light streak
    const streakProg = (t + 0.2) % 1.0;
    const sx = Math.round(streakProg * W);
    const sy = Math.round(H * 0.15 + streakProg * 45);
    canvas.drawLine(sx - 20, sy - 14, sx, sy, [...WHITE, Math.round(160 * Math.sin(streakProg * Math.PI))], 2);

    const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, 135, 218, 100 + 10 * pulse, GLOW, 3, Math.round(100 + 25 * pulse));
    drawMascot(canvas, 135, 218, 165, t);

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'splash.png');
}

// 12. figures.png (1:1, 3s loop: figure rotates back and forth on pedestal)
function genCategoryFigures() {
  const W = 360, H = 360, FPS = 6, TOTAL = 18;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient([10, 40, 120], BLUE);
    grid(canvas, 30, 18);

    // Pedestal
    canvas.fillRoundedRect(W * 0.25, H * 0.70, W * 0.50, H * 0.16, 12, [...MID, 255], [...WHITE, 200], 2);
    // Collectible figurine on pedestal with slight rotation angle offset
    const rot = 4 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, W * 0.5, H * 0.40, 90, GLOW, 2, 100);
    canvas.fillEllipse(W * 0.5 + rot, H * 0.35, 35, 45, [...VL, 255]);
    canvas.fillRoundedRect(W * 0.40 + rot, H * 0.42, 70, 80, 16, [...WHITE, 255], [...BLUE, 255], 2);
    canvas.fillCircle(W * 0.5 + rot, H * 0.48, 8, [...GOLD, 255]);

    // Mascot
    drawMascot(canvas, Math.round(W * 0.72), Math.round(H * 0.60), 130, t);

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'figures.png');
}

// 13. manga.png (1:1, 3s loop: open manga pages flutter with soft glow)
function genCategoryManga() {
  const W = 360, H = 360, FPS = 6, TOTAL = 18;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient([10, 40, 120], BLUE);
    grid(canvas, 30, 18);

    // Open manga books
    const flutter = 3 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, W * 0.46, H * 0.46, 80, GLOW, 2, 110);
    for (let k = 0; k < 3; k++) {
      canvas.fillRoundedRect(80 + k * 18, 100 + k * 10 - (k === 0 ? flutter : 0), 160, 120, 10, [...WHITE, 220 - k * 30], [...BLUE, 255], 2);
    }
    // Gold bookmark ribbon
    canvas.fillRoundedRect(160, 90, 8, 50, 3, [...GOLD, 255]);

    drawMascot(canvas, Math.round(W * 0.75), Math.round(H * 0.60), 130, t);

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'manga.png');
}

// 14. apparel.png (1:1, 3s loop: hoodie sways in breeze)
function genCategoryApparel() {
  const W = 360, H = 360, FPS = 6, TOTAL = 18;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient([10, 40, 120], BLUE);
    grid(canvas, 30, 18);

    const sway = 3 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, W * 0.46, H * 0.44, 90, GLOW, 2, 100);
    // Anime hoodie polygon
    const hPts = [
      [110 + sway, 110], [150, 90], [210, 90], [250 + sway, 110],
      [280 + sway, 170], [240 + sway, 190], [230, 160],
      [230, 260], [130, 260], [130, 160], [120 - sway, 190], [80 - sway, 170]
    ];
    canvas.fillPolygon(hPts, [...WHITE, 240]);
    canvas.fillCircle(180, 140, 8, [...GOLD, 255]);

    drawMascot(canvas, Math.round(W * 0.75), Math.round(H * 0.60), 130, t);

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'apparel.png');
}

// 15. art.png (1:1, 3s loop: poster frame glow pulses, light sweep passes)
function genCategoryWallArt() {
  const W = 360, H = 360, FPS = 6, TOTAL = 18;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient([10, 40, 120], BLUE);
    grid(canvas, 30, 18);

    const sweep = (t * W) % W;
    // Frame
    canvas.fillRoundedRect(70, 70, 180, 200, 12, [...WHITE, 240], [...NAVY, 255], 6);
    // Artwork inside
    canvas.fillRoundedRect(80, 80, 160, 180, 8, [...DEEP, 255]);
    canvas.fillCircle(160, 130, 28, [...GLOW, 255]);
    canvas.fillPolygon([[90, 240], [140, 180], [180, 210], [220, 160], [240, 240]], [...BLUE, 255]);
    canvas.fillCircle(160, 130, 8, [...GOLD, 255]);

    // Light sweep line
    canvas.drawLine(sweep, 80, sweep + 30, 260, [...WHITE, 120], 3);

    drawMascot(canvas, Math.round(W * 0.75), Math.round(H * 0.60), 130, t, { armAdjust: 1 });

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'art.png');
}

// 16. collectibles.png (1:1, 3s loop: sparkles glint across glass case, capsules bob)
function genCategoryCollectibles() {
  const W = 360, H = 360, FPS = 6, TOTAL = 18;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient([10, 40, 120], BLUE);
    grid(canvas, 30, 18);

    const capBob = 3 * Math.sin(2 * Math.PI * t);
    // Glass display case
    canvas.fillRoundedRect(80, 80, 170, 200, 16, [...WHITE, 60], [...WHITE, 220], 3);
    // Capsules bobbing
    canvas.fillCircle(130, 150 + capBob, 22, [...LIGHT, 240]);
    canvas.fillCircle(190, 180 - capBob, 22, [...GLOW, 240]);
    canvas.fillCircle(150, 220 + capBob, 20, [...GOLD, 240]);

    // Sparkles glint
    const glintAlpha = Math.round(150 + 105 * Math.sin(2 * Math.PI * t * 2));
    canvas.fillCircle(95, 95, 3, [...WHITE, glintAlpha]);
    canvas.fillCircle(235, 120, 3, [...WHITE, glintAlpha]);

    drawMascot(canvas, Math.round(W * 0.75), Math.round(H * 0.60), 130, t);

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'collectibles.png');
}

// 17. accessories.png (1:1, 3s loop: keychains, pins and wristband orbit slowly)
function genCategoryAccessories() {
  const W = 360, H = 360, FPS = 6, TOTAL = 18;
  const frames = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient([10, 40, 120], BLUE);
    grid(canvas, 30, 18);

    // Orbit ring
    canvas.drawArc(180, 180, 95, 95, 0, 360, [...LIGHT, 70], 1.5);

    // Orbiting keychains / pins
    for (let o = 0; o < 3; o++) {
      const oAngle = 2 * Math.PI * (t + o / 3);
      const ox = Math.round(180 + Math.cos(oAngle) * 95);
      const oy = Math.round(180 + Math.sin(oAngle) * 95);
      if (o === 0) {
        canvas.fillCircle(ox, oy, 14, [...GOLD, 255]);
        canvas.fillCircle(ox, oy, 6, [...WHITE, 255]);
      } else if (o === 1) {
        canvas.fillRoundedRect(ox - 12, oy - 12, 24, 24, 6, [...SKY, 255], [...WHITE, 220], 1.5);
      } else {
        canvas.fillCircle(ox, oy, 12, [...GLOW, 255]);
      }
    }

    drawCelGlow(canvas, 180, 180, 60, GLOW, 2, 80);
    drawMascot(canvas, 180, 180, 140, t);

    frames.push(canvas);
  }
  saveAPNG(frames, W, H, FPS, 'accessories.png');
}

// Master execution
console.log('Generating all 17 ANILyfe APNG assets...');
genLoaderMascot();
genLoaderMascotBlink();
genHomepage();
genAdmin();
genSeller();
genAuth();
genMarketplace();
genCheckout();
gen404();
genEmpty();
genSplash();
genCategoryFigures();
genCategoryManga();
genCategoryApparel();
genCategoryWallArt();
genCategoryCollectibles();
genCategoryAccessories();
console.log('All 17 APNG assets generated successfully.');
