// Bundle the shared quiz validation and summaries for the CommonJS server.
const { buildSync } = require('esbuild')
const path = require('node:path')

buildSync({
  entryPoints: [path.join(__dirname, '../src/content/quiz.ts')],
  outfile: path.join(__dirname, 'quiz-bundle.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  define: { 'import.meta.env': '{}' },
})
