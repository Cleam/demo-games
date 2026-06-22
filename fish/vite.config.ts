import { defineConfig } from 'vite'
import { resolve, extname, join } from 'path'
import { createReadStream, existsSync, statSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.json': 'application/json',
}

// 开发模式将 ./assets 目录映射到 /assets URL 路径
function serveLocalAssetsPlugin() {
  return {
    name: 'serve-local-assets',
    configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: { setHeader: (k: string, v: string) => void; statusCode: number }, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0])
        if (!url.startsWith('/assets/')) return next()

        const filePath = join(__dirname, url)
        try {
          if (existsSync(filePath) && statSync(filePath).isFile()) {
            const mime = MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
            res.setHeader('Content-Type', mime)
            res.setHeader('Cache-Control', 'no-cache')
            ;(createReadStream(filePath) as unknown as { pipe: (r: unknown) => void }).pipe(res)
            return
          }
        } catch {
          // 文件不存在时继续传递给下一个处理器
        }
        next()
      })
    },
  }
}

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  publicDir: 'public',
  plugins: [serveLocalAssetsPlugin()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
})
