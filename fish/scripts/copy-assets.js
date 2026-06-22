/**
 * copy-assets.js
 * 构建后将 assets/ 目录复制到 dist/assets/，使 dist/ 可独立部署。
 */

import { cpSync, mkdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..')

try { mkdirSync(join(ROOT, 'dist', 'assets'), { recursive: true }) } catch {}

cpSync(join(ROOT, 'assets'), join(ROOT, 'dist', 'assets'), { recursive: true })
console.log('[copy-assets] assets → dist/assets ✓')
