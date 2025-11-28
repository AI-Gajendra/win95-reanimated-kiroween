/**
 * Icon Generator for Win95 Reanimated
 * 
 * This script generates application icons in the Windows 95 style.
 * It creates a 512x512 PNG icon that can be converted to ICO and ICNS formats.
 * 
 * Requirements: 1.5, 10.1, 11.2, 11.3, 11.4
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Win95 color palette
const COLORS = {
  teal: [0, 128, 128],      // Desktop background
  navy: [0, 0, 128],        // Title bar
  white: [255, 255, 255],   // Highlights
  gray: [192, 192, 192],    // Window background
  darkGray: [128, 128, 128], // Shadows
  black: [0, 0, 0],         // Text/borders
  yellow: [255, 255, 0],    // Accent
};

// CRC32 implementation for PNG
let crcTable = null;
function getCRC32Table() {
  if (crcTable) return crcTable;
  
  crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }
  return crcTable;
}

function crc32(data) {
  let crc = 0xffffffff;
  const table = getCRC32Table();
  
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createIHDRChunk(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data.writeUInt8(8, 8);  // bit depth
  data.writeUInt8(6, 9);  // color type (RGBA)
  data.writeUInt8(0, 10); // compression
  data.writeUInt8(0, 11); // filter
  data.writeUInt8(0, 12); // interlace
  
  return createChunk('IHDR', data);
}

function createIDATChunk(width, height, pixels) {
  // Create raw image data with filter bytes
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0; // No filter
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (width * 4 + 1) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];     // R
      rawData[dstIdx + 1] = pixels[srcIdx + 1]; // G
      rawData[dstIdx + 2] = pixels[srcIdx + 2]; // B
      rawData[dstIdx + 3] = pixels[srcIdx + 3]; // A
    }
  }
  
  const compressed = zlib.deflateSync(rawData);
  return createChunk('IDAT', compressed);
}

function createIENDChunk() {
  return createChunk('IEND', Buffer.alloc(0));
}

function createPNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = createIHDRChunk(width, height);
  const idat = createIDATChunk(width, height, pixels);
  const iend = createIENDChunk();
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

/**
 * Draw a Win95-style computer monitor icon
 */
function drawWin95Icon(size) {
  const pixels = new Uint8Array(size * size * 4);
  
  // Fill with transparent
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 0;
    pixels[i + 1] = 0;
    pixels[i + 2] = 0;
    pixels[i + 3] = 0;
  }
  
  const scale = size / 512;
  
  function setPixel(x, y, color, alpha = 255) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    pixels[idx] = color[0];
    pixels[idx + 1] = color[1];
    pixels[idx + 2] = color[2];
    pixels[idx + 3] = alpha;
  }
  
  function fillRect(x1, y1, x2, y2, color) {
    for (let y = Math.floor(y1 * scale); y < Math.floor(y2 * scale); y++) {
      for (let x = Math.floor(x1 * scale); x < Math.floor(x2 * scale); x++) {
        setPixel(x, y, color);
      }
    }
  }
  
  function drawBeveledRect(x1, y1, x2, y2, thickness) {
    const t = Math.max(1, Math.floor(thickness * scale));
    for (let i = 0; i < t; i++) {
      for (let x = Math.floor(x1 * scale) + i; x < Math.floor(x2 * scale) - i; x++) {
        setPixel(x, Math.floor(y1 * scale) + i, COLORS.white);
      }
      for (let y = Math.floor(y1 * scale) + i; y < Math.floor(y2 * scale) - i; y++) {
        setPixel(Math.floor(x1 * scale) + i, y, COLORS.white);
      }
    }
    for (let i = 0; i < t; i++) {
      for (let x = Math.floor(x1 * scale) + i; x < Math.floor(x2 * scale) - i; x++) {
        setPixel(x, Math.floor(y2 * scale) - 1 - i, COLORS.darkGray);
      }
      for (let y = Math.floor(y1 * scale) + i; y < Math.floor(y2 * scale) - i; y++) {
        setPixel(Math.floor(x2 * scale) - 1 - i, y, COLORS.darkGray);
      }
    }
  }
  
  // Draw monitor body
  fillRect(56, 40, 456, 360, COLORS.gray);
  drawBeveledRect(56, 40, 456, 360, 8);
  
  // Draw screen bezel
  fillRect(80, 64, 432, 320, COLORS.darkGray);
  
  // Draw screen (teal desktop)
  fillRect(96, 80, 416, 304, COLORS.teal);
  
  // Draw a mini window on the screen
  fillRect(120, 100, 320, 240, COLORS.gray);
  fillRect(120, 100, 320, 130, COLORS.navy);
  fillRect(130, 108, 200, 122, COLORS.white);
  fillRect(296, 104, 314, 126, COLORS.gray);
  fillRect(124, 134, 316, 236, COLORS.white);
  
  // Text lines in window
  fillRect(132, 145, 280, 155, COLORS.black);
  fillRect(132, 165, 260, 175, COLORS.black);
  fillRect(132, 185, 290, 195, COLORS.black);
  fillRect(132, 205, 240, 215, COLORS.black);
  
  // Taskbar
  fillRect(96, 280, 416, 304, COLORS.gray);
  fillRect(100, 284, 160, 300, COLORS.gray);
  
  // Windows logo colors
  fillRect(104, 288, 112, 294, [255, 0, 0]);
  fillRect(114, 288, 122, 294, [0, 255, 0]);
  fillRect(104, 294, 112, 300, [0, 0, 255]);
  fillRect(114, 294, 122, 300, [255, 255, 0]);
  
  // Monitor stand
  fillRect(180, 360, 332, 400, COLORS.gray);
  drawBeveledRect(180, 360, 332, 400, 4);
  
  // Monitor base
  fillRect(120, 400, 392, 440, COLORS.gray);
  drawBeveledRect(120, 400, 392, 440, 6);
  
  // Power LED
  fillRect(400, 330, 420, 345, [0, 255, 0]);
  
  return pixels;
}

// Generate icons
console.log('Generating Win95 Reanimated icons...');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Main 512x512 icon
const size = 512;
const pixels = drawWin95Icon(size);
const pngBuffer = createPNG(size, size, pixels);
const pngPath = path.join(assetsDir, 'icon.png');
fs.writeFileSync(pngPath, pngBuffer);
console.log(`Created: ${pngPath}`);

// Generate smaller sizes
const sizes = [16, 32, 48, 64, 128, 256];
for (const s of sizes) {
  const smallPixels = drawWin95Icon(s);
  const smallPng = createPNG(s, s, smallPixels);
  const smallPath = path.join(assetsDir, `icon-${s}.png`);
  fs.writeFileSync(smallPath, smallPng);
  console.log(`Created: ${smallPath}`);
}

console.log('\n✅ PNG icons generated successfully!');
