import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: true,
  // sourcemap: true,
  clean: true,
  target: 'es2022',
  minify: true,
  outDir: 'dist',
  format: ['cjs', 'esm'],
  outExtension: ({ format }) => {
    if (format === 'esm') return { js: '.mjs', dts: '.d.ts' }
    return { js: '.cjs', dts: '.d.ts' }
  },
  bundle: true,
  dts: true,
})
