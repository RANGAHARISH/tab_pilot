import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const zipFile = path.join(rootDir, 'tabpilot-extension.zip');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

// Remove old zip if present
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

try {
  execSync(`cd "${distDir}" && zip -r "${zipFile}" . -x "*.DS_Store"`, { stdio: 'inherit' });
  const stats = fs.statSync(zipFile);
  console.log(`✓ Extension packaged successfully: tabpilot-extension.zip (${(stats.size / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error('Failed to package extension:', err);
  process.exit(1);
}
