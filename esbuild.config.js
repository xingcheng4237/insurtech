import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['server/_core/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  // Explicitly exclude vite and its config from the bundle
  external: [
    'vite',
    'vite-*',
    '@vitejs/*',
    '@builder.io/*',
    '@tailwindcss/vite',
    './vite.config.js',
    '../vite.config.js',
    '../../vite.config.js'
  ],
  // Mark vite.ts as external so it's not bundled
  plugins: [{
    name: 'exclude-vite-files',
    setup(build) {
      // Exclude vite.config.js and vite.ts from being bundled
      build.onResolve({ filter: /vite\.config/ }, () => {
        return { external: true };
      });
    }
  }]
});

console.log('Server build complete');
