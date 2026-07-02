// Simple script to generate PWA icons
// This creates placeholder icons - replace with actual icons later
const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple SVG icon (green circle with plant symbol)
function createSVGIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#16a34a" rx="${size * 0.2}"/>
  <g fill="white">
    <!-- Plant/Leaf icon -->
    <path d="M${size * 0.3} ${size * 0.7} Q${size * 0.5} ${size * 0.3} ${size * 0.7} ${size * 0.7}" stroke="white" stroke-width="${size * 0.05}" fill="none" stroke-linecap="round"/>
    <circle cx="${size * 0.4}" cy="${size * 0.6}" r="${size * 0.03}" fill="white"/>
    <circle cx="${size * 0.6}" cy="${size * 0.6}" r="${size * 0.03}" fill="white"/>
    <path d="M${size * 0.5} ${size * 0.7} L${size * 0.5} ${size * 0.85}" stroke="white" stroke-width="${size * 0.05}" stroke-linecap="round"/>
  </g>
</svg>`;
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons (Note: For production, convert these to PNG)
console.log('Generating PWA icons...');
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created ${svgPath}`);
});

console.log('\n✅ Icon generation complete!');
console.log('⚠️  Note: These are SVG placeholders. For production, convert to PNG format.');
console.log('   You can use online tools like https://cloudconvert.com/svg-to-png or ImageMagick');

