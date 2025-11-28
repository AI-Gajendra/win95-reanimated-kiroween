/**
 * ICNS Generator for Win95 Reanimated
 * 
 * Converts PNG icons to macOS ICNS format
 * Requirements: 11.3
 * 
 * ICNS format reference: https://en.wikipedia.org/wiki/Apple_Icon_Image_format
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// ICNS icon types and their corresponding sizes
// Modern ICNS uses PNG data for most sizes
const ICNS_TYPES = {
  'icp4': 16,   // 16x16
  'icp5': 32,   // 32x32
  'icp6': 64,   // 64x64 (actually 48x48 in some docs, but 64 works)
  'ic07': 128,  // 128x128
  'ic08': 256,  // 256x256
  'ic09': 512,  // 512x512
  'ic10': 1024, // 1024x1024 (we'll use 512 scaled)
};

// Read available PNG files
const pngFiles = {};
const sizes = [16, 32, 48, 64, 128, 256, 512];

for (const size of sizes) {
  const pngPath = path.join(assetsDir, `icon-${size}.png`);
  if (fs.existsSync(pngPath)) {
    pngFiles[size] = fs.readFileSync(pngPath);
  }
}

// Also check for main icon.png (512x512)
const mainIconPath = path.join(assetsDir, 'icon.png');
if (fs.existsSync(mainIconPath)) {
  pngFiles[512] = fs.readFileSync(mainIconPath);
}

console.log('Available PNG sizes:', Object.keys(pngFiles).join(', '));

/**
 * Create ICNS file from PNG buffers
 */
function createICNS(pngFiles) {
  const chunks = [];
  
  // Map our PNG sizes to ICNS types
  const sizeToType = {
    16: 'icp4',
    32: 'icp5',
    64: 'icp6',
    128: 'ic07',
    256: 'ic08',
    512: 'ic09',
  };
  
  for (const [size, type] of Object.entries(sizeToType)) {
    const sizeNum = parseInt(size);
    if (pngFiles[sizeNum]) {
      const pngData = pngFiles[sizeNum];
      
      // Create chunk: 4-byte type + 4-byte length + data
      const chunkSize = 8 + pngData.length;
      const chunk = Buffer.alloc(chunkSize);
      
      // Write type (4 ASCII chars)
      chunk.write(type, 0, 4, 'ascii');
      
      // Write size (big-endian)
      chunk.writeUInt32BE(chunkSize, 4);
      
      // Write PNG data
      pngData.copy(chunk, 8);
      
      chunks.push(chunk);
      console.log(`  Added ${type} (${size}x${size}): ${pngData.length} bytes`);
    }
  }
  
  // Calculate total size
  const dataSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const totalSize = 8 + dataSize; // 8 bytes for header
  
  // Create final buffer
  const icns = Buffer.alloc(totalSize);
  let pos = 0;
  
  // Write ICNS header
  icns.write('icns', pos, 4, 'ascii'); pos += 4;
  icns.writeUInt32BE(totalSize, pos); pos += 4;
  
  // Write all chunks
  for (const chunk of chunks) {
    chunk.copy(icns, pos);
    pos += chunk.length;
  }
  
  return icns;
}

if (Object.keys(pngFiles).length === 0) {
  console.error('No PNG files found. Run generate-icons.cjs first.');
  process.exit(1);
}

console.log('Generating ICNS file...');
const icnsBuffer = createICNS(pngFiles);
const icnsPath = path.join(assetsDir, 'icon.icns');
fs.writeFileSync(icnsPath, icnsBuffer);
console.log(`✅ Created: ${icnsPath} (${icnsBuffer.length} bytes)`);
