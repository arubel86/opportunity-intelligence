import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '../..')

function cleanUrlsPlugin() {
  const routes = {
    '/login': '/login.html',
    '/dashboard': '/index.html',
    '/landing-1': '/landing-1.html',
    '/landing-2': '/landing-2.html'
  }

  const handler = (req, res, next) => {
    const [pathname, query] = req.url.split('?')
    const normalized = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
    if (routes[normalized]) {
      req.url = routes[normalized] + (query ? '?' + query : '')
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ROOT, '')
  const insforgeUrl = env.VITE_INSFORGE_URL || env.INSFORGE_URL || env.API_BASE_URL || 'https://insforge.aizprua.com'
  const insforgeKey = env.VITE_INSFORGE_API_KEY || env.INSFORGE_API_KEY || env.API_KEY || ''
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || insforgeUrl
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || insforgeKey

  return {
    plugins: [cleanUrlsPlugin()],
    define: {
      'import.meta.env.VITE_INSFORGE_URL': JSON.stringify(insforgeUrl),
      'import.meta.env.VITE_INSFORGE_API_KEY': JSON.stringify(insforgeKey),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey)
    },
    server: {
      port: 5180,
      host: true,
      allowedHosts: true
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          login: resolve(__dirname, 'login.html'),
          'landing-1': resolve(__dirname, 'landing-1.html'),
          'landing-2': resolve(__dirname, 'landing-2.html')
        }
      }
    }
  }
})

