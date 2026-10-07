import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const zip = new AdmZip();

// Add directories
const dirsToAdd = ['src', 'public', 'scripts'];
dirsToAdd.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    zip.addLocalFolder(dirPath, dir);
  }
});

// Add specific root files
const filesToAdd = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'index.html',
  'metadata.json',
  'vercel.json',
  'GUIA_SEGURIDAD_Y_ACTUALIZACION.md',
  'README.md',
  '.gitignore',
  '.env.example',
  'firebase-applet-config.json'
];

filesToAdd.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    zip.addLocalFile(filePath);
  }
});

const zipPath = path.join(__dirname, 'public', 'proyecto-gregory-izquierdo.zip');
zip.writeZip(zipPath);

console.log('ZIP generated successfully with ADM-ZIP at: ' + zipPath);

// Copy to root as well
fs.copyFileSync(zipPath, path.join(__dirname, 'proyecto-gregory-izquierdo.zip'));
