// @ts-check

import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['./src/index.js'],
  bundle: true,
  outdir: './dist',
  outExtension: {
    '.js': '.mjs',
  },
  format: 'esm',
  minify: true,
})
