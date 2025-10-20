import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔨 Building Neeki Hub for production...\n');

// Create dist directory
const distDir = path.join(rootDir, 'dist');
if (fs.existsSync(distDir)) {
  console.log('📁 Cleaning existing dist directory...');
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Files and directories to copy
const itemsToCopy = [
  { src: 'public', dest: 'public', type: 'dir' },
  { src: 'src', dest: 'src', type: 'dir' },
  { src: 'api', dest: 'api', type: 'dir' },
  { src: 'data', dest: 'data', type: 'dir' },
  { src: 'sw.js', dest: 'sw.js', type: 'file' },
  { src: 'manifest.json', dest: 'manifest.json', type: 'file' },
  { src: 'server.js', dest: 'server.js', type: 'file' },
  { src: 'package.json', dest: 'package.json', type: 'file' },
  { src: '.env.example', dest: '.env.example', type: 'file' },
  { src: 'README.md', dest: 'README.md', type: 'file' }
];

console.log('📁 Copying files to dist/...\n');

function copyDirectory(source, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const destPath = path.join(dest, file);
    
    const stat = fs.lstatSync(sourcePath);
    
    if (stat.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

itemsToCopy.forEach(item => {
  const source = path.join(rootDir, item.src);
  const dest = path.join(distDir, item.dest);
  
  if (fs.existsSync(source)) {
    if (item.type === 'dir') {
      copyDirectory(source, dest);
      console.log(`✓ Copied ${item.src}/`);
    } else {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(source, dest);
      console.log(`✓ Copied ${item.src}`);
    }
  } else {
    console.warn(`⚠ Skipped ${item.src} (not found)`);
  }
});

// Create a production-ready package.json in dist
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
delete packageJson.devDependencies;
packageJson.scripts = {
  start: "NODE_ENV=production node server.js"
};

fs.writeFileSync(
  path.join(distDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

console.log('\n✅ Build complete! Files ready in dist/\n');
console.log('📦 Next steps:');
console.log('1. cd dist');
console.log('2. cp .env.example .env');
console.log('3. Edit .env with your API keys');
console.log('4. npm install --production');
console.log('5. npm start\n');
console.log('🚀 Or deploy the dist/ folder to your hosting provider\n');