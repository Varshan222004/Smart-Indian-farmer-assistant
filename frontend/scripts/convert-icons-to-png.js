// Convert SVG icons to PNG using sharp
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

async function convertIcons() {
  console.log('Converting SVG icons to PNG...');
  
  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    if (fs.existsSync(svgPath)) {
      try {
        await sharp(svgPath)
          .resize(size, size)
          .png()
          .toFile(pngPath);
        console.log(`✅ Converted ${size}x${size} icon`);
      } catch (error) {
        console.error(`❌ Error converting ${size}x${size}:`, error.message);
      }
    } else {
      console.warn(`⚠️  SVG not found: ${svgPath}`);
    }
  }
  
  console.log('\n✅ Icon conversion complete!');
}

convertIcons().catch(console.error);

