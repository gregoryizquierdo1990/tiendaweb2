const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const output = fs.createWriteStream(path.join(__dirname, '../public/proyecto-gregory-izquierdo.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', function() {
  console.log('Archive created successfully! Total bytes: ' + archive.pointer());
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

archive.glob('**/*', {
  cwd: path.join(__dirname, '..'),
  ignore: [
    'node_modules/**',
    '.git/**',
    '.aistudio/**',
    'dist/**',
    'public/proyecto-gregory-izquierdo.zip'
  ]
});

archive.finalize();
