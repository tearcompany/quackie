const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const ctx = esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  minify: production,
  sourcemap: !production,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  platform: 'node',
  target: 'node18',
  logLevel: 'info',
});

if (watch) {
  ctx.then((context) => context.watch());
} else {
  ctx.then((context) => context.rebuild().then(() => context.dispose()));
}
