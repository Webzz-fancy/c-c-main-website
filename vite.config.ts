import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Vite otherwise returns the SPA home page with 200 for every unknown path.
// Match the production server for document requests during local development.
const notFoundInDev: Plugin = {
  name: 'clause-not-found-in-dev',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if ((req.method !== 'GET' && req.method !== 'HEAD') || !req.headers.accept?.includes('text/html')) return next()
      const path = new URL(req.url ?? '/', 'http://localhost').pathname
      if (path === '/' || path === '/simple' || path === '/complex' || path === '/simple/' || path === '/complex/') return next()
      const html = readFileSync(resolve(process.cwd(), 'public/404.html'))
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('X-Robots-Tag', 'noindex')
      res.end(req.method === 'HEAD' ? undefined : html)
    })
  },
}

export default defineConfig({
  plugins: [react(), notFoundInDev],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
})
