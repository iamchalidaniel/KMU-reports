const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting KMU Reports web build process...\n');

// Step 1: Install frontend dependencies
console.log('📦 Installing frontend dependencies...');
execSync('npm install', { cwd: './frontend', stdio: 'inherit' });

// Step 2: Install backend dependencies
console.log('📦 Installing backend dependencies...');
execSync('npm install', { cwd: './backend', stdio: 'inherit' });

// Step 3: Build frontend
console.log('🔨 Building frontend...');
execSync('npm run build', { cwd: './frontend', stdio: 'inherit' });

// Step 4: Prepare backend for production
console.log('🔨 Preparing backend for production...');
const backendPackageJson = JSON.parse(fs.readFileSync('./backend/package.json', 'utf8'));
backendPackageJson.scripts.start = 'node ./bin/www';
fs.writeFileSync('./backend/package.json', JSON.stringify(backendPackageJson, null, 2));

console.log('\n✅ Build complete! Frontend and backend are ready for deployment.');
console.log('📁 Frontend build: frontend/.next/');
console.log('📁 Backend: backend/');
