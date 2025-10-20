import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconsDir = path.join(__dirname, '../public/assets/icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes for PWA
const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

console.log('🎨 Generating icon placeholders...\n');

// Generate SVG placeholder for each size
const generateIcon = (size) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#b8860b;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#d4af37;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5d76e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="#050406"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="url(#grad${size})"/>
  <text x="50%" y="58%" text-anchor="middle" fill="#050406" font-family="Arial, sans-serif" font-size="${size/8}" font-weight="bold">NH</text>
</svg>`;

  const svgFilename = `icon-${size}x${size}.svg`;
  
  fs.writeFileSync(path.join(iconsDir, svgFilename), svg);
  console.log(`✓ Created ${svgFilename}`);
  
  // Note about PNG conversion
  if (size === 512) {
    console.log('\n📝 Note: SVG placeholders created.');
    console.log('For production, convert to PNG using:');
    console.log('  - Online: https://cloudconvert.com/svg-to-png');
    console.log('  - CLI: inkscape or imagemagick');
    console.log('  - Node: sharp library\n');
  }
};

// Generate all sizes
sizes.forEach(size => generateIcon(size));

// Generate logo variants
const logoHorizontal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" role="img" aria-labelledby="logoTitle logoDesc">
  <title id="logoTitle">Neeki Hub</title>
  <desc id="logoDesc">Islamic Spiritual Dashboard Logo</desc>
  <defs>
    <linearGradient id="goldGradH" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#b8860b;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#d4af37;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5d76e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <g id="icon">
    <path fill="url(#goldGradH)" d="M20,25 L35,20 L35,55 L20,60 Z M45,20 L60,25 L60,60 L45,55 Z"/>
    <path fill="url(#goldGradH)" d="M65,15 Q70,10 75,15 Q80,20 75,25 Q70,30 65,25 Q60,20 65,15 Z"/>
  </g>
  <text x="90" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="url(#goldGradH)">
    Neeki Hub
  </text>
</svg>`;

const logoStacked = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" role="img" aria-labelledby="logoStackedTitle">
  <title id="logoStackedTitle">Neeki Hub Icon</title>
  <defs>
    <linearGradient id="goldGradS" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#b8860b;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#d4af37;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5d76e;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect x="20" y="30" width="25" height="50" rx="3" fill="url(#goldGradS)" filter="url(#shadow)"/>
  <rect x="55" y="30" width="25" height="50" rx="3" fill="url(#goldGradS)" filter="url(#shadow)"/>
  <path d="M70,15 Q80,10 85,20 Q88,30 78,35 Q73,33 70,28 Q74,23 70,15 Z" fill="url(#goldGradS)" filter="url(#shadow)"/>
  <text x="50" y="105" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="url(#goldGradS)" text-anchor="middle">
    Neeki Hub
  </text>
</svg>`;

const logoMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="logoMaskableTitle">
  <title id="logoMaskableTitle">Neeki Hub App Icon</title>
  <defs>
    <linearGradient id="goldGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#b8860b;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#d4af37;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f5d76e;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="bgGrad">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#050406;stop-opacity:1" />
    </radialGradient>
  </defs>
  <circle cx="256" cy="256" r="256" fill="url(#bgGrad)"/>
  <g transform="translate(256, 256)">
    <rect x="-60" y="20" width="50" height="60" rx="2" fill="url(#goldGradM)"/>
    <rect x="10" y="20" width="50" height="60" rx="2" fill="url(#goldGradM)"/>
    <path d="M0,-80 Q30,-100 40,-70 Q45,-40 20,-30 Q10,-35 0,-45 Q15,-60 0,-80 Z" fill="url(#goldGradM)"/>
    <circle cx="60" cy="-60" r="3" fill="url(#goldGradM)" opacity="0.8"/>
    <circle cx="-60" cy="-50" r="2" fill="url(#goldGradM)" opacity="0.6"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'logo-horizontal.svg'), logoHorizontal);
console.log('✓ Created logo-horizontal.svg');

fs.writeFileSync(path.join(iconsDir, 'logo-stacked.svg'), logoStacked);
console.log('✓ Created logo-stacked.svg');

fs.writeFileSync(path.join(iconsDir, 'logo-maskable.svg'), logoMaskable);
console.log('✓ Created logo-maskable.svg');

console.log('\n✅ Icon generation complete!\n');
console.log('📁 Icons saved to: public/assets/icons/\n');