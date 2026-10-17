// ANILyfe APNG and Static Asset Generator
// Generates seamless 3-second APNG loops for loader-mascot.png, splash.png, and homepage.png
// strictly conforming to palette and size limits (< 1 MB).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
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
const BLUSH = [255, 170, 190];

// Cel-shaded banded glow for crisp anime look and high compression
function drawCelGlow(canvas, cx, cy, r, color, rings = 4, maxAlpha = 140) {
  const [cr, cg, cb] = color;
  for (let i = rings; i >= 1; i--) {
    const ringR = (r * i) / rings;
    const alpha = Math.round((maxAlpha * (rings - i + 1)) / (rings + 1));
    canvas.fillCircle(cx, cy, ringR, [cr, cg, cb, alpha]);
  }
}

// Draw ANILyfe Mascot on a Canvas2D
function drawMascot(canvas, cx, cy, size, t = 0, visor = false) {
  // t: progress [0, 1) over 3 seconds
  // 1. Subtle float: 6px vertical oscillation
  const floatDy = -6 * Math.sin(2 * Math.PI * t);
  // 2. Hair sway: gentle horizontal sway
  const hairSway = 2.5 * Math.sin(2 * Math.PI * t);
  const hairSway2 = 1.5 * Math.cos(2 * Math.PI * t);
  // 3. One soft blink around t = [0.65, 0.75]
  let blink = 0;
  if (t >= 0.65 && t <= 0.75) {
    blink = Math.sin(((t - 0.65) / 0.10) * Math.PI);
  }
  // 4. Antenna pulse
  const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);

  const s = size;
  const mCanvas = new Canvas2D(Math.ceil(s * 1.4), Math.ceil(s * 1.4));
  const ox = Math.floor(s * 0.2);
  const oy = Math.floor(s * 0.2);

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

  // Fringe bangs with subtle motion
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

  // Mouth arc
  mCanvas.drawArc(ox + 0.50 * s, oy + 0.74 * s, 0.08 * s, 0.06 * s, 20, 160, [...NAVY, 255], Math.max(2, Math.round(0.025 * s)));

  // Visor if enabled
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

  // Antenna spark lights (pulsing slowly)
  const sparkRadius = (0.026 + 0.008 * pulse) * s;
  for (const [ax, ay] of [[0.5, 0.0], [0.22, 0.04], [0.78, 0.04]]) {
    const scx = ox + ax * s;
    const scy = oy + ay * s;
    drawCelGlow(mCanvas, scx, scy, sparkRadius * 2.2, GLOW, 2, Math.round(140 + 60 * pulse));
    mCanvas.fillCircle(scx, scy, sparkRadius, [...WHITE, 255]);
  }

  const finalX = Math.round(cx - mCanvas.width / 2);
  const finalY = Math.round(cy - mCanvas.height / 2 + floatDy);
  canvas.composite(mCanvas, finalX, finalY);
}

function grid(canvas, step = 48, alpha = 20) {
  for (let x = 0; x < canvas.width; x += step) {
    canvas.drawLine(x, 0, x, canvas.height, [...LIGHT, alpha], 1);
  }
  for (let y = 0; y < canvas.height; y += step) {
    canvas.drawLine(0, y, canvas.width, y, [...LIGHT, alpha], 1);
  }
}

function skyline(canvas, base = 0.82) {
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
    for (let wy = top + 10; wy < H - 15; wy += 18) {
      for (let wx = x + 6; wx < x + w - 6; wx += 14) {
        if (rand() < 0.35) {
          canvas.fillRoundedRect(wx, wy, 5, 6, 2, [...GLOW, 120]);
        }
      }
    }
    x += w + 4;
  }
}

// 1. Generate loader-mascot.png (APNG, 512x512, 3.0s, 30 frames @ 10fps)
function generateLoaderMascot() {
  console.log('Generating loader-mascot.png APNG (512x512)...');
  const W = 512, H = 512;
  const FPS = 10;
  const TOTAL_FRAMES = 30; // 3.0s loop
  const frames = [];

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const t = i / TOTAL_FRAMES;
    const canvas = new Canvas2D(W, H);
    const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, 256, 256, 170 + 20 * pulse, GLOW, 3, Math.round(90 + 30 * pulse));
    drawMascot(canvas, 256, 256, 340, t);
    frames.push(canvas);
  }

  const apngBuf = encodeAPNG(frames, W, H, FPS);
  fs.writeFileSync(path.join(OUT_DIR, 'loader-mascot.png'), apngBuf);
  console.log(`Saved loader-mascot.png (${(apngBuf.length / 1024).toFixed(1)} KB)`);
}

// 2. Generate splash.png (APNG, 360x640, 3.0s loop, 24 frames @ 8fps)
function generateSplash() {
  console.log('Generating splash.png APNG (360x640)...');
  const W = 360, H = 640;
  const FPS = 8;
  const TOTAL_FRAMES = 24;
  const frames = [];

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const t = i / TOTAL_FRAMES;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient([5, 18, 56], [13, 58, 156]);
    grid(canvas, 32, 22);
    skyline(canvas, 0.88);
    const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, 180, 290, 140 + 15 * pulse, GLOW, 3, Math.round(100 + 25 * pulse));
    drawMascot(canvas, 180, 290, 220, t);
    frames.push(canvas);
  }

  const apngBuf = encodeAPNG(frames, W, H, FPS);
  fs.writeFileSync(path.join(OUT_DIR, 'splash.png'), apngBuf);
  console.log(`Saved splash.png (${(apngBuf.length / 1024).toFixed(1)} KB)`);
}

// 3. Generate homepage.png (APNG, 640x360, 3.0s loop, 20 frames @ 6.67fps)
function generateHomepage() {
  console.log('Generating homepage.png APNG (640x360)...');
  const W = 640, H = 360;
  const FPS = 20; // 20 frames with delay_num=3, delay_den=20 gives exactly 3.0s (0.15s per frame)
  const TOTAL_FRAMES = 20;
  const frames = [];

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const t = i / TOTAL_FRAMES;
    const canvas = new Canvas2D(W, H);
    canvas.fillGradient(DEEP, [13, 58, 156]);
    grid(canvas, 36, 16);
    skyline(canvas, 0.82);

    // Floating panels
    const panelFloat = 3 * Math.cos(2 * Math.PI * t);
    const panels = [
      [W * 0.36, H * 0.16 + panelFloat, W * 0.16, H * 0.22],
      [W * 0.34, H * 0.52 - panelFloat, W * 0.14, H * 0.20],
      [W * 0.86, H * 0.28 - panelFloat, W * 0.11, H * 0.18],
      [W * 0.82, H * 0.60 + panelFloat, W * 0.12, H * 0.18]
    ];
    for (const [px, py, pw, ph] of panels) {
      canvas.fillRoundedRect(px, py, pw, ph, 12, [...WHITE, 35], [...LIGHT, 80], 1.5);
      canvas.fillRoundedRect(px + 8, py + 8, pw - 16, ph - 30, 6, [...LIGHT, 55]);
      canvas.fillRoundedRect(px + 8, py + ph - 18, (pw - 16) * 0.6, 8, 3, [...WHITE, 100]);
    }

    const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
    drawCelGlow(canvas, W * 0.66, H * 0.50, 130 + 15 * pulse, GLOW, 3, Math.round(85 + 20 * pulse));
    drawMascot(canvas, Math.round(W * 0.66), Math.round(H * 0.48), 220, t);

    frames.push(canvas);
  }

  const apngBuf = encodeAPNG(frames, W, H, 7); // ~7 fps for 3.0s total
  fs.writeFileSync(path.join(OUT_DIR, 'homepage.png'), apngBuf);
  console.log(`Saved homepage.png (${(apngBuf.length / 1024).toFixed(1)} KB)`);
}

// Generate static loader-mascot-blink.png fallback
function generateStaticBlink() {
  console.log('Generating static loader-mascot-blink.png fallback (512x512)...');
  const W = 512, H = 512;
  const canvas = new Canvas2D(W, H);
  drawCelGlow(canvas, 256, 256, 170, GLOW, 3, 100);
  drawMascot(canvas, 256, 256, 340, 0.70); // Full blink at t=0.70
  const rawScanlines = canvas.toRawScanlines();
  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const chunks = [
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ];
  fs.writeFileSync(path.join(OUT_DIR, 'loader-mascot-blink.png'), Buffer.concat(chunks));
  console.log('Saved static loader-mascot-blink.png');
}

// Run all
console.log('Generating APNG and static assets for ANILyfe...');
generateLoaderMascot();
generateSplash();
generateHomepage();
generateStaticBlink();
console.log('Finished generating all assets successfully.');
