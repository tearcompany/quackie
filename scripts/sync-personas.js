const fs = require('fs');
const path = require('path');

const extensionRoot = path.join(__dirname, '..');
const repoRoot = path.join(extensionRoot, '..');

const sources = [
  { from: 'personas-male', to: 'personas/personas-male' },
  { from: 'personas-female', to: 'personas/personas-female' },
  { from: 'personas-archetypes', to: 'personas/personas-archetypes' },
];

function copyDirectory(source, destination) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, { recursive: true });
}

for (const { from, to } of sources) {
  const sourcePath = path.join(repoRoot, from);
  const destinationPath = path.join(extensionRoot, to);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Persona source not found: ${sourcePath}`);
  }

  copyDirectory(sourcePath, destinationPath);
  console.log(`Synced ${from} -> ${to}`);
}
