// APNG Generator for ANILyfe
// Creates standard-compliant APNG files with zero external dependencies using Node.js built-in modules.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf, start = 0, length = buf.length - start) {
  let c = 0xffffffff;
  for (let i = start; i < start + length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk, 4, 4 + len);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// 2D Software Rasterizer for RGBA Buffers
class Canvas2D {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height * 4); // RGBA
  }

  clear(r = 0, g = 0, b = 0, a = 0) {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = a;
    }
  }

  setPixel(x, y, r, g, b, a) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || a <= 0) return;
    const idx = (y * this.width + x) * 4;
    const srcA = a / 255;
    const dstA = this.data[idx + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA <= 0) return;
    this.data[idx] = Math.round((r * srcA + this.data[idx] * dstA * (1 - srcA)) / outA);
    this.data[idx + 1] = Math.round((g * srcA + this.data[idx + 1] * dstA * (1 - srcA)) / outA);
    this.data[idx + 2] = Math.round((b * srcA + this.data[idx + 2] * dstA * (1 - srcA)) / outA);
    this.data[idx + 3] = Math.round(outA * 255);
  }

  fillGradient(c1, c2, diag = true) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const t = diag ? (x / this.width * 0.45 + y / this.height * 0.55) : y / this.height;
        const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
        const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
        const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
        const idx = (y * this.width + x) * 4;
        this.data[idx] = r;
        this.data[idx + 1] = g;
        this.data[idx + 2] = b;
        this.data[idx + 3] = 255;
      }
    }
  }

  fillCircle(cx, cy, r, color) {
    const minX = Math.max(0, Math.floor(cx - r - 1));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + r + 1));
    const minY = Math.max(0, Math.floor(cy - r - 1));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + r + 1));
    const rSq = r * r;
    const [cr, cg, cb, ca = 255] = color;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dSq = (x - cx) ** 2 + (y - cy) ** 2;
        if (dSq <= rSq) {
          const edge = Math.sqrt(dSq) - r;
          const alpha = edge <= -0.5 ? 1 : Math.max(0, Math.min(1, 0.5 - edge));
          this.setPixel(x, y, cr, cg, cb, Math.round(ca * alpha));
        }
      }
    }
  }

  fillGlow(cx, cy, r, color, maxAlpha = 150) {
    const minX = Math.max(0, Math.floor(cx - r * 1.8));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + r * 1.8));
    const minY = Math.max(0, Math.floor(cy - r * 1.8));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + r * 1.8));
    const [cr, cg, cb] = color;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (d < r * 1.8) {
          const factor = Math.exp(- (d * d) / (2 * (r * 0.55) ** 2));
          const a = Math.round(maxAlpha * factor);
          if (a > 0) this.setPixel(x, y, cr, cg, cb, a);
        }
      }
    }
  }

  fillEllipse(cx, cy, rx, ry, color) {
    const minX = Math.max(0, Math.floor(cx - rx - 1));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + rx + 1));
    const minY = Math.max(0, Math.floor(cy - ry - 1));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + ry + 1));
    const [cr, cg, cb, ca = 255] = color;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (d <= 1) {
          const edge = Math.sqrt(d) - 1;
          const alpha = edge <= -0.05 ? 1 : Math.max(0, Math.min(1, -edge * 10));
          this.setPixel(x, y, cr, cg, cb, Math.round(ca * alpha));
        }
      }
    }
  }

  drawArc(cx, cy, rx, ry, startDeg, endDeg, color, strokeWidth = 2) {
    const [cr, cg, cb, ca = 255] = color;
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const steps = Math.ceil(Math.max(rx, ry) * 4);
    for (let i = 0; i <= steps; i++) {
      const angle = startRad + (endRad - startRad) * (i / steps);
      const px = cx + rx * Math.cos(angle);
      const py = cy + ry * Math.sin(angle);
      this.fillCircle(px, py, strokeWidth / 2, color);
    }
  }

  fillRoundedRect(x, y, w, h, radius, color, outlineColor = null, outlineWidth = 0) {
    const [cr, cg, cb, ca = 255] = color;
    const r = Math.min(radius, w / 2, h / 2);
    const minX = Math.max(0, Math.floor(x - outlineWidth));
    const maxX = Math.min(this.width - 1, Math.ceil(x + w + outlineWidth));
    const minY = Math.max(0, Math.floor(y - outlineWidth));
    const maxY = Math.min(this.height - 1, Math.ceil(y + h + outlineWidth));

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        let inside = false;
        let dist = 0;

        const left = x + r, right = x + w - r;
        const top = y + r, bottom = y + h - r;

        if (px >= left && px <= right && py >= y && py <= y + h) {
          inside = true;
        } else if (py >= top && py <= bottom && px >= x && px <= x + w) {
          inside = true;
        } else if (px < left && py < top) {
          dist = Math.sqrt((px - left) ** 2 + (py - top) ** 2);
          inside = dist <= r;
        } else if (px > right && py < top) {
          dist = Math.sqrt((px - right) ** 2 + (py - top) ** 2);
          inside = dist <= r;
        } else if (px < left && py > bottom) {
          dist = Math.sqrt((px - left) ** 2 + (py - bottom) ** 2);
          inside = dist <= r;
        } else if (px > right && py > bottom) {
          dist = Math.sqrt((px - right) ** 2 + (py - bottom) ** 2);
          inside = dist <= r;
        }

        if (inside) {
          this.setPixel(px, py, cr, cg, cb, ca);
        }
      }
    }

    if (outlineColor && outlineWidth > 0) {
      this.strokeRoundedRect(x, y, w, h, radius, outlineColor, outlineWidth);
    }
  }

  strokeRoundedRect(x, y, w, h, radius, color, strokeWidth) {
    const r = Math.min(radius, w / 2, h / 2);
    // top & bottom
    this.drawLine(x + r, y, x + w - r, y, color, strokeWidth);
    this.drawLine(x + r, y + h, x + w - r, y + h, color, strokeWidth);
    // left & right
    this.drawLine(x, y + r, x, y + h - r, color, strokeWidth);
    this.drawLine(x + w, y + r, x + w, y + h - r, color, strokeWidth);
    // corners
    this.drawArc(x + r, y + r, r, r, 180, 270, color, strokeWidth);
    this.drawArc(x + w - r, y + r, r, r, 270, 360, color, strokeWidth);
    this.drawArc(x + w - r, y + h - r, r, r, 0, 90, color, strokeWidth);
    this.drawArc(x + r, y + h - r, r, r, 90, 180, color, strokeWidth);
  }

  drawLine(x1, y1, x2, y2, color, width = 1) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) {
      this.fillCircle(x1, y1, width / 2, color);
      return;
    }
    const steps = Math.ceil(len * 2);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.fillCircle(x1 + dx * t, y1 + dy * t, width / 2, color);
    }
  }

  fillPolygon(pts, color) {
    if (pts.length < 3) return;
    const [cr, cg, cb, ca = 255] = color;
    let minY = this.height, maxY = 0;
    for (const p of pts) {
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    }
    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(this.height - 1, Math.ceil(maxY));

    for (let y = minY; y <= maxY; y++) {
      const nodeX = [];
      let j = pts.length - 1;
      for (let i = 0; i < pts.length; i++) {
        if ((pts[i][1] < y && pts[j][1] >= y) || (pts[j][1] < y && pts[i][1] >= y)) {
          nodeX.push(pts[i][0] + ((y - pts[i][1]) / (pts[j][1] - pts[i][1])) * (pts[j][0] - pts[i][0]));
        }
        j = i;
      }
      nodeX.sort((a, b) => a - b);
      for (let i = 0; i < nodeX.length; i += 2) {
        if (nodeX[i] >= this.width) break;
        if (nodeX[i + 1] > 0) {
          if (nodeX[i] < 0) nodeX[i] = 0;
          if (nodeX[i + 1] > this.width) nodeX[i + 1] = this.width;
          for (let x = Math.floor(nodeX[i]); x <= Math.ceil(nodeX[i + 1]); x++) {
            this.setPixel(x, y, cr, cg, cb, ca);
          }
        }
      }
    }
  }

  composite(other, dx = 0, dy = 0) {
    for (let y = 0; y < other.height; y++) {
      const targetY = y + dy;
      if (targetY < 0 || targetY >= this.height) continue;
      for (let x = 0; x < other.width; x++) {
        const targetX = x + dx;
        if (targetX < 0 || targetX >= this.width) continue;
        const sIdx = (y * other.width + x) * 4;
        const sa = other.data[sIdx + 3];
        if (sa > 0) {
          this.setPixel(targetX, targetY, other.data[sIdx], other.data[sIdx + 1], other.data[sIdx + 2], sa);
        }
      }
    }
  }

  toRawScanlines() {
    const raw = Buffer.alloc(this.height * (1 + this.width * 4));
    let offset = 0;
    for (let y = 0; y < this.height; y++) {
      raw[offset++] = 0; // Filter type 0 (None)
      const rowStart = y * this.width * 4;
      for (let x = 0; x < this.width * 4; x++) {
        raw[offset++] = this.data[rowStart + x];
      }
    }
    return raw;
  }
}

// APNG Encoder
function encodeAPNG(frames, width, height, fps = 20) {
  const numFrames = frames.length;
  const chunks = [];

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  chunks.push(signature);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: Deflate
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0
  chunks.push(makeChunk('IHDR', ihdr));

  // acTL chunk (Animation Control)
  const actl = Buffer.alloc(8);
  actl.writeUInt32BE(numFrames, 0); // num_frames
  actl.writeUInt32BE(0, 4); // num_plays (0 = infinite loop)
  chunks.push(makeChunk('acTL', actl));

  let sequenceNumber = 0;

  for (let i = 0; i < numFrames; i++) {
    const frame = frames[i];
    const rawScanlines = frame.toRawScanlines();
    const compressed = zlib.deflateSync(rawScanlines, { level: 9 });

    // fcTL chunk
    const fctl = Buffer.alloc(26);
    fctl.writeUInt32BE(sequenceNumber++, 0); // sequence_number
    fctl.writeUInt32BE(width, 4); // width
    fctl.writeUInt32BE(height, 8); // height
    fctl.writeUInt32BE(0, 12); // x_offset
    fctl.writeUInt32BE(0, 16); // y_offset
    fctl.writeUInt16BE(1, 20); // delay_num
    fctl.writeUInt16BE(fps, 22); // delay_den (1/fps seconds per frame)
    fctl[24] = 0; // dispose_op: APNG_DISPOSE_OP_NONE
    fctl[25] = 0; // blend_op: APNG_BLEND_OP_SOURCE
    chunks.push(makeChunk('fcTL', fctl));

    if (i === 0) {
      // First frame uses IDAT
      chunks.push(makeChunk('IDAT', compressed));
    } else {
      // Subsequent frames use fdAT
      const fdat = Buffer.alloc(4 + compressed.length);
      fdat.writeUInt32BE(sequenceNumber++, 0);
      compressed.copy(fdat, 4);
      chunks.push(makeChunk('fdAT', fdat));
    }
  }

  // IEND chunk
  chunks.push(makeChunk('IEND', Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

module.exports = { Canvas2D, encodeAPNG, makeChunk };
