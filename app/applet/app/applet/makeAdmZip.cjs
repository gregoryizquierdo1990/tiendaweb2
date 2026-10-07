const AdmZip = require('adm-zip');
const path = require('path');

const zip = new AdmZip();
const rootDir = path.join(__dirname);

// Add directories
zip.addLocalFolder(path.join(rootDir, 'src'), 'src');
zip.addLocalFolder(path.join(rootDir, 'public'), 'public');
zip.addLocalFolder(path.join(rootDir, 'scripts'), 'scripts');

// Add root files
const rootFiles = ['package.json', 'vite.config.ts', 'tsconfig.json', 'index.html', 'metadata.json', 'vercel.json', '.env.example', 'GUIA_SEGURIDAD_Y_ACTUALIZACION.md'];
rootFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (require('fs').existsSync(filePath)) {
    zip.addLocalFile(filePath);
  }
});

zip.writeZip(path.join(rootDir, 'public/proyecto-gregory-izquierdo.zip'));
console.log('AdmZip archive generated successfully!');
