/**
 * ICO Generator for Win95 Reanimated
 * 
 * Converts PNG icons to Windows ICO format
 * Requirements: 11.2
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// Read PNG files
const pngSizes = [16, 32, 48, 64, 128, 256];
const pngBuffers = [];

for (const size of pngSizes) {
  const pngPath = path.join(assetsDir, `icon-${size}.png`);
  if (fs.existsSync(pngPath)) {
    pngBuffers.push({
      size,
      data: fs.readFileSync(pngPath)
    });
  }
}

if (pngBuffers.length === 0) {
  console.error('No PNG files found. Run generate-icons.cjs first.');
  process.exit(1);
}

console.log('Generating ICO file from sizes:', pngBuffers.map(p => p.size).join(', '));

/**
 * Create ICO file from PNG buffers
 * ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)
 */
function createICO(images) {
  // ICO header: 6 bytes
  // ICONDIR structure
  const headerSize = 6;
  const entrySize = 16; // ICONDIRENTRY size
  const numImages = images.length;
  
  // Calculate total size
  let dataOffset = headerSize + (entrySize * numImages);
  const entries = [];
  
  for (const img of images) {
    entries.push({
      width: img.size >= 256 ? 0 : img.size, // 0 means 256
      height: img.size >= 256 ? 0 : img.size,
      colorCount: 0,
      reserved: 0,
      planes: 1,
      bitCount: 32,
      size: img.data.length,
      offset: dataOffset
    });
    dataOffset += img.data.length;
  }
  
  // Create buffer
  const totalSize = dataOffset;
  const buffer = Buffer.alloc(totalSize);
  let pos = 0;
  
  // Write ICONDIR header
  buffer.writeUInt16LE(0, pos); pos += 2;      // Reserved
  buffer.writeUInt16LE(1, pos); pos += 2;      // Type (1 = ICO)
  buffer.writeUInt16LE(numImages, pos); pos += 2; // Number of images
  
  // Write ICONDIRENTRY for each image
  for (const entry of entries) {
    buffer.writeUInt8(entry.width, pos); pos += 1;
    buffer.writeUInt8(entry.height, pos); pos += 1;
    buffer.writeUInt8(entry.colorCount, pos); pos += 1;
    buffer.writeUInt8(entry.reserved, pos); pos += 1;
    buffer.writeUInt16LE(entry.planes, pos); pos += 2;
    buffer.writeUInt16LE(entry.bitCount, pos); pos += 2;
    buffer.writeUInt32LE(entry.size, pos); pos += 4;
    buffer.writeUInt32LE(entry.offset, pos); pos += 4;
  }
  
  // Write image data (PNG format is valid in ICO)
  for (const img of images) {
    img.data.copy(buffer, pos);
    pos += img.data.length;
  }
  
  return buffer;
}

const icoBuffer = createICO(pngBuffers);
const icoPath = path.join(assetsDir, 'icon.ico');
fs.writeFileSync(icoPath, icoBuffer);
console.log(`✅ Created: ${icoPath}`);
