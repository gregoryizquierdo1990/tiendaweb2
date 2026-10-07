const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const zipPath = path.join(__dirname, 'public', 'proyecto-gregory-izquierdo.zip');
// Ensure public directory exists
if (!fs.existsSync(path.dirname(zipPath))) {
  fs.mkdirSync(path.dirname(zipPath), { recursive: true });
}

const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', function() {
  console.log('Project zip created successfully at public/proyecto-gregory-izquierdo.zip. Total bytes: ' + archive.pointer());
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

archive.glob('**/*', {
  cwd: __dirname,
  ignore: [
    'node_modules/**',
    '.git/**',
    '.aistudio/**',
    'dist/**',
    'public/proyecto-gregory-izquierdo.zip',
    'build_zip.js',
    'makeZip.cjs',
    'createZip.cjs',
    'makeAdmZip.cjs'
  ]
});

archive.finalize();
