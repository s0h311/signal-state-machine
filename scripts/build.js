// @ts-check

import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  outdir: './dist',
  outExtension: {
    '.js': '.mjs',
  },
  format: 'esm',
  minify: true,
  tsconfig: './tsconfig.json',
})
