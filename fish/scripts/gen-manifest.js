/**
 * gen-manifest.js
 * 扫描 assets/images/ 目录，生成 public/manifest.json 资源清单。
 * 跳过 Thumbs.db / .DS_Store，对 skin_fish_151011 的扁平目录结构特殊处理。
 */

import { readdirSync, statSync, mkdirSync, writeFileSync } from 'fs'
import { join, extname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..')
const IMAGES_DIR = join(ROOT, 'assets', 'images')
const PUBLIC_DIR = join(ROOT, 'public')
const OUTPUT_PATH = join(PUBLIC_DIR, 'manifest.json')

const SKIP_FILES = new Set(['Thumbs.db', '.DS_Store', 'desktop.ini'])
const HERO_ACTIONS = ['idle', 'move', 'atk', 'ult', 'ultb', 'die']
const EFF_TYPES = ['eff_atk', 'eff_hit', 'eff_ult']

// skin_fish_151011 帧文件直接放在顶层，无 hero/ 子目录
const SKIN_FLAT_ID = 'skin_fish_151011'

function safeReadDir(dir) {
  try {
    return readdirSync(dir).filter(f => !SKIP_FILES.has(f))
  } catch {
    return []
  }
}

function isDirectory(p) {
  try { return statSync(p).isDirectory() } catch { return false }
}

function isFile(p) {
  try { return statSync(p).isFile() } catch { return false }
}

function naturalSort(arr) {
  return [...arr].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  )
}

// 将绝对路径转换为以 / 开头的 URL 相对路径
function toUrlPath(absPath) {
  const rel = absPath.slice(ROOT.length).replace(/\\/g, '/')
  return rel.startsWith('/') ? rel : '/' + rel
}

// 从帧文件名提取动作名：fish_11002-idle_00.png → 'idle'
function extractAction(filename) {
  const m = filename.match(/-([a-zA-Z]+)_\d+\.png$/)
  return m ? m[1] : null
}

const manifest = {
  version: 1,
  heroes: {},
  effects: {},
  ui: {},
}

// 扫描顶层图片（bg.png, sk.png 等 UI 图）
for (const f of safeReadDir(IMAGES_DIR)) {
  const full = join(IMAGES_DIR, f)
  if (isFile(full) && extname(f).toLowerCase() === '.png') {
    manifest.ui[basename(f, '.png')] = toUrlPath(full)
  }
}

// 扫描各鱼角色目录
for (const fishId of safeReadDir(IMAGES_DIR)) {
  const fishDir = join(IMAGES_DIR, fishId)
  if (!isDirectory(fishDir)) continue

  const heroFrames = {}
  const effectFrames = {}

  if (fishId === SKIN_FLAT_ID) {
    // 特殊处理：帧文件直接在顶层目录
    const files = safeReadDir(fishDir).filter(f => extname(f).toLowerCase() === '.png')
    for (const action of HERO_ACTIONS) {
      const frames = naturalSort(
        files
          .filter(f => extractAction(f) === action)
          .map(f => toUrlPath(join(fishDir, f)))
      )
      if (frames.length > 0) heroFrames[action] = frames
    }
  } else {
    // 普通鱼：hero/ 子目录存放角色帧
    const heroDir = join(fishDir, 'hero')
    const heroFiles = safeReadDir(heroDir).filter(f => extname(f).toLowerCase() === '.png')
    for (const action of HERO_ACTIONS) {
      const frames = naturalSort(
        heroFiles
          .filter(f => extractAction(f) === action)
          .map(f => toUrlPath(join(heroDir, f)))
      )
      if (frames.length > 0) heroFrames[action] = frames
    }

    // 特效子目录
    for (const effType of EFF_TYPES) {
      const effDir = join(fishDir, effType)
      const effFiles = safeReadDir(effDir).filter(f => extname(f).toLowerCase() === '.png')
      if (effFiles.length > 0) {
        effectFrames[effType] = naturalSort(effFiles.map(f => toUrlPath(join(effDir, f))))
      }
    }
  }

  if (Object.keys(heroFrames).length > 0) manifest.heroes[fishId] = heroFrames
  if (Object.keys(effectFrames).length > 0) manifest.effects[fishId] = effectFrames
}

// 确保 public/ 目录存在
try { mkdirSync(PUBLIC_DIR, { recursive: true }) } catch {}

writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2), 'utf8')

// 统计输出
const heroCount = Object.keys(manifest.heroes).length
const heroFrames = Object.values(manifest.heroes).reduce(
  (s, h) => s + Object.values(h).reduce((ss, f) => ss + f.length, 0), 0
)
const effFrames = Object.values(manifest.effects).reduce(
  (s, e) => s + Object.values(e).reduce((ss, f) => ss + f.length, 0), 0
)

console.log(`[gen-manifest] ${heroCount} 角色 | hero帧: ${heroFrames} | 特效帧: ${effFrames}`)
console.log(`[gen-manifest] 输出 → ${OUTPUT_PATH}`)
