import fs from 'fs';

const paths = [
  'src/components/AuthModal.tsx',
  'foodexa/src/components/AuthModal.tsx'
];

for (const p of paths) {
  let content = fs.readFileSync(p, 'utf8');

  // I will just git checkout the files to reset them, then apply the correct changes!
  console.log('Will checkout and re-apply correctly for ' + p);
}
