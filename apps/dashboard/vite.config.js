import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

import fs from 'fs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '../..')

function cleanUrlsPlugin() {
  const routes = {
    '/login': resolve(__dirname, 'login.html'),
    '/dashboard': resolve(__dirname, 'index.html'),
    '/catalogo': resolve(__dirname, '../catalogo/index.html'),
    '/propiedades': resolve(__dirname, '../landings/landing1.html'),
    '/autos': resolve(__dirname, '../landings/landing2.html'),
    '/landings/landing1': resolve(__dirname, '../landings/landing1.html'),
    '/landings/landing2': resolve(__dirname, '../landings/landing2.html'),
    '/landing1': resolve(__dirname, '../landings/landing1.html'),
    '/landing2': resolve(__dirname, '../landings/landing2.html'),
    '/landing-1': resolve(__dirname, '../landings/landing1.html'),
    '/landing-2': resolve(__dirname, '../landings/landing2.html')
  }

  const handler = (req, res, next) => {
    const [pathname] = req.url.split('?')
    const normalized = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
    if (routes[normalized]) {
      const filePath = routes[normalized]
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(fs.readFileSync(filePath, 'utf-8'))
        return
      }
    }
    next()
  }

  return {
    name: 'clean-urls',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    }
  }
}

function copyStaticPagesPlugin() {
  return {
    name: 'copy-static-pages',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      if (fs.existsSync(distDir)) {
        fs.copyFileSync(resolve(__dirname, '../catalogo/index.html'), resolve(distDir, 'catalogo.html'))
        fs.copyFileSync(resolve(__dirname, '../landings/landing1.html'), resolve(distDir, 'landing1.html'))
        fs.copyFileSync(resolve(__dirname, '../landings/landing2.html'), resolve(distDir, 'landing2.html'))
      }
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ROOT, '')
  const insforgeUrl = env.VITE_INSFORGE_URL || env.INSFORGE_URL || env.API_BASE_URL || 'https://insforge.aizprua.com'
  const insforgeKey = env.VITE_INSFORGE_API_KEY || env.INSFORGE_API_KEY || env.API_KEY || ''
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || insforgeUrl
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || insforgeKey

  return {
    plugins: [cleanUrlsPlugin(), copyStaticPagesPlugin()],
    define: {
      'import.meta.env.VITE_INSFORGE_URL': JSON.stringify(insforgeUrl),
      'import.meta.env.VITE_INSFORGE_API_KEY': JSON.stringify(insforgeKey),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey)
    },
    server: {
      port: 5180,
      host: true,
      allowedHosts: true,
      fs: {
        allow: [resolve(__dirname, '../..')]
      }
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          login: resolve(__dirname, 'login.html')
        }
      }
    }
  }
})

