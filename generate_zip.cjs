const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const zipPath = path.join(__dirname, 'public', 'proyecto-gregory-izquierdo.zip');
if (!fs.existsSync(path.dirname(zipPath))) {
  fs.mkdirSync(path.dirname(zipPath), { recursive: true });
}

const output = fs.createWriteStream(zipPath);
const archiverFunc = typeof archiver === 'function' ? archiver : (archiver.default || archiver);
const archive = archiverFunc('zip', { zlib: { level: 9 } });

output.on('close', function() {
  console.log('ZIP generated successfully: ' + zipPath + ' (' + archive.pointer() + ' total bytes)');
  // Also copy to root
  fs.copyFileSync(zipPath, path.join(__dirname, 'proyecto-gregory-izquierdo.zip'));
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
    'proyecto-gregory-izquierdo.zip',
    'generate_zip.cjs',
    'generate_zip.js',
    'build_zip.js',
    'app/**'
  ]
});

archive.finalize();
