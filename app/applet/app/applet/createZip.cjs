const fs = require('fs');
const path = require('path');
const archiverPkg = require('archiver');
const archiver = archiverPkg.default || archiverPkg;

const zipPath = path.join(__dirname, 'public/proyecto-gregory-izquierdo.zip');
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', function() {
  console.log('ZIP archive created successfully. Total bytes: ' + archive.pointer());
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

archive.directory(path.join(__dirname, 'src'), 'src');
archive.directory(path.join(__dirname, 'public'), 'public');
archive.directory(path.join(__dirname, 'scripts'), 'scripts');

const rootFiles = ['package.json', 'vite.config.ts', 'tsconfig.json', 'index.html', 'metadata.json', 'vercel.json', '.env.example', 'GUIA_SEGURIDAD_Y_ACTUALIZACION.md'];
rootFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    archive.file(filePath, { name: file });
  }
});

archive.finalize();
