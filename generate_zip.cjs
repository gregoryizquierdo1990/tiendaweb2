const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const rootDir = __dirname;
const zip = new AdmZip();

const exclude = new Set([
  'node_modules',
  '.git',
  '.aistudio',
  'dist',
  'project_backup.zip',
  'proyecto-gregory-izquierdo.zip',
  'public/proyecto-gregory-izquierdo.zip'
]);

function addFilesRecursively(currentPath, zipPathPrefix = '') {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryName = entry.name;
    if (exclude.has(entryName) || entryName.startsWith('.DS_Store')) {
      continue;
    }

    const fullPath = path.join(currentPath, entryName);
    const zipPath = zipPathPrefix ? `${zipPathPrefix}/${entryName}` : entryName;

    if (entry.isDirectory()) {
      addFilesRecursively(fullPath, zipPath);
    } else {
      zip.addLocalFile(fullPath, zipPathPrefix);
    }
  }
}

console.log('Empaquetando archivos del proyecto...');
addFilesRecursively(rootDir);

const publicZipPath = path.join(rootDir, 'public', 'proyecto-gregory-izquierdo.zip');
const rootZipPath = path.join(rootDir, 'proyecto-gregory-izquierdo.zip');

if (!fs.existsSync(path.dirname(publicZipPath))) {
  fs.mkdirSync(path.dirname(publicZipPath), { recursive: true });
}

zip.writeZip(publicZipPath);
zip.writeZip(rootZipPath);

console.log('ZIP generado exitosamente en:');
console.log('1. ' + publicZipPath);
console.log('2. ' + rootZipPath);
