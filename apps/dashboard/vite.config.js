import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

import fs from 'fs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '../..')

function cleanUrlsPlugin(envConfig) {
  const routes = {
    '/login': resolve(__dirname, 'login.html'),
    '/dashboard': resolve(__dirname, 'index.html'),
    '/catalogo': resolve(__dirname, '../catalogo/index.html'),
    '/catalogo/avaluo-autos': resolve(__dirname, '../catalogo/avaluo-autos.html'),
    '/catalogo/avaluo-propiedades': resolve(__dirname, '../catalogo/avaluo-propiedades.html'),
    '/avaluo-autos': resolve(__dirname, '../catalogo/avaluo-autos.html'),
    '/avaluo-propiedades': resolve(__dirname, '../catalogo/avaluo-propiedades.html'),
    '/propiedades': resolve(__dirname, '../landings/landing1.html'),
    '/autos': resolve(__dirname, '../landings/landing2.html'),
    '/landings/landing1': resolve(__dirname, '../landings/landing1.html'),
    '/landings/landing2': resolve(__dirname, '../landings/landing2.html'),
    '/landing1': resolve(__dirname, '../landings/landing1.html'),
    '/landing2': resolve(__dirname, '../landings/landing2.html'),
    '/landing-1': resolve(__dirname, '../landings/landing1.html'),
    '/landing-2': resolve(__dirname, '../landings/landing2.html'),
    '/llms.txt': resolve(__dirname, 'public/llms.txt')
  }

  const handler = (req, res, next) => {
    const [pathname] = req.url.split('?')
    const normalized = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
    if (routes[normalized]) {
      const filePath = routes[normalized]
      if (fs.existsSync(filePath)) {
        const isMarkdown = filePath.endsWith('.txt') || filePath.endsWith('.md')
        res.setHeader('Content-Type', isMarkdown ? 'text/markdown; charset=utf-8' : 'text/html; charset=utf-8')
        let content = fs.readFileSync(filePath, 'utf-8')
        if (!isMarkdown && envConfig?.insforgeKey) {
          const envScript = `<script>window.INSFORGE_URL=${JSON.stringify(envConfig.insforgeUrl)};window.INSFORGE_KEY=${JSON.stringify(envConfig.insforgeKey)};</script>`
          content = content.replace('<head>', `<head>\n  ${envScript}`)
        }
        res.end(content)
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

function copyStaticPagesPlugin(envConfig) {
  return {
    name: 'copy-static-pages',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      if (fs.existsSync(distDir)) {
        const injectEnv = (srcPath) => {
          let content = fs.readFileSync(srcPath, 'utf-8')
          if (envConfig?.insforgeKey) {
            const envScript = `<script>window.INSFORGE_URL=${JSON.stringify(envConfig.insforgeUrl)};window.INSFORGE_KEY=${JSON.stringify(envConfig.insforgeKey)};</script>`
            content = content.replace('<head>', `<head>\n  ${envScript}`)
          }
          return content
        }

        const catalogoDir = resolve(distDir, 'catalogo')
        if (!fs.existsSync(catalogoDir)) fs.mkdirSync(catalogoDir, { recursive: true })

        fs.writeFileSync(resolve(distDir, 'catalogo.html'), injectEnv(resolve(__dirname, '../catalogo/index.html')))
        fs.writeFileSync(resolve(catalogoDir, 'index.html'), injectEnv(resolve(__dirname, '../catalogo/index.html')))
        fs.writeFileSync(resolve(catalogoDir, 'avaluo-autos.html'), injectEnv(resolve(__dirname, '../catalogo/avaluo-autos.html')))
        fs.writeFileSync(resolve(catalogoDir, 'avaluo-propiedades.html'), injectEnv(resolve(__dirname, '../catalogo/avaluo-propiedades.html')))
        fs.writeFileSync(resolve(distDir, 'avaluo-autos.html'), injectEnv(resolve(__dirname, '../catalogo/avaluo-autos.html')))
        fs.writeFileSync(resolve(distDir, 'avaluo-propiedades.html'), injectEnv(resolve(__dirname, '../catalogo/avaluo-propiedades.html')))
        fs.writeFileSync(resolve(distDir, 'landing1.html'), injectEnv(resolve(__dirname, '../landings/landing1.html')))
        fs.writeFileSync(resolve(distDir, 'landing2.html'), injectEnv(resolve(__dirname, '../landings/landing2.html')))
        const llmsFile = resolve(__dirname, 'public/llms.txt')
        if (fs.existsSync(llmsFile)) {
          fs.copyFileSync(llmsFile, resolve(distDir, 'llms.txt'))
        }
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
  const envConfig = { insforgeUrl, insforgeKey }

  return {
    plugins: [cleanUrlsPlugin(envConfig), copyStaticPagesPlugin(envConfig)],
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

