/**
 * gen-manifest.js
 * 扫描新资源结构，生成 public/manifest.json。
 * - hero/lv* 目录仅收录 atk 帧
 * - npc/0* 目录仅收录 idle 帧
 * - boss/ 目录按序收录帧图
 * - 所有引用帧生成 trim / anchor 元数据
 * - 忽略 assets/images/_tmp
 */

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { basename, extname, join } from 'path'
import { fileURLToPath } from 'url'
import { inflateSync } from 'zlib'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..')
const IMAGES_DIR = join(ROOT, 'assets', 'images')
const PUBLIC_DIR = join(ROOT, 'public')
const OUTPUT_PATH = join(PUBLIC_DIR, 'manifest.json')

const HERO_DIR = join(IMAGES_DIR, 'hero')
const HERO_END_DIR = join(HERO_DIR, 'end')
const NPC_DIR = join(IMAGES_DIR, 'npc')
const BOSS_DIR = join(IMAGES_DIR, 'boss')

const HERO_LEVELS = ['lv0', 'lv30', 'lv60', 'lv90', 'lv120']
const NPC_WAVES = ['01', '02', '03', '04', '05']
const SKIP_FILES = new Set(['Thumbs.db', '.DS_Store', 'desktop.ini'])

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
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  )
}

function toUrlPath(absPath) {
  const rel = absPath.slice(ROOT.length).replace(/\\/g, '/')
  return rel.startsWith('/') ? rel.slice(1) : rel
}

function paethPredictor(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

function parsePngTrim(filePath) {
  const buf = readFileSync(filePath)
  const signature = buf.subarray(0, 8)
  const expectedSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  if (!signature.equals(expectedSig)) {
    throw new Error(`不是合法 PNG: ${filePath}`)
  }

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 8
  let colorType = 6
  const idatParts = []
  let palette = null
  let transparency = null

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset)
    const type = buf.toString('ascii', offset + 4, offset + 8)
    const data = buf.subarray(offset + 8, offset + 8 + length)
    offset += 12 + length

    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data.readUInt8(8)
      colorType = data.readUInt8(9)
    } else if (type === 'PLTE') {
      palette = data
    } else if (type === 'tRNS') {
      transparency = data
    } else if (type === 'IDAT') {
      idatParts.push(data)
    } else if (type === 'IEND') {
      break
    }
  }

  if (colorType === 3 && bitDepth !== 8) {
    throw new Error(`暂不支持非 8-bit 索引 PNG: ${filePath}`)
  }
  if (colorType !== 3 && bitDepth !== 8) {
    throw new Error(`暂不支持非 8-bit PNG: ${filePath}`)
  }

  let bpp = 4
  if (colorType === 2) bpp = 3
  else if (colorType === 3) bpp = 1
  else if (colorType !== 6) throw new Error(`暂不支持 colorType=${colorType}: ${filePath}`)

  const compressed = Buffer.concat(idatParts)
  const raw = inflateSync(compressed)
  const stride = width * bpp
  const pixels = Buffer.alloc(height * stride)

  let src = 0
  let dst = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[src++]
    for (let x = 0; x < stride; x++) {
      const byte = raw[src++]
      const left = x >= bpp ? pixels[dst + x - bpp] : 0
      const up = y > 0 ? pixels[dst + x - stride] : 0
      const upLeft = y > 0 && x >= bpp ? pixels[dst + x - stride - bpp] : 0

      switch (filter) {
        case 0: pixels[dst + x] = byte; break
        case 1: pixels[dst + x] = (byte + left) & 255; break
        case 2: pixels[dst + x] = (byte + up) & 255; break
        case 3: pixels[dst + x] = (byte + Math.floor((left + up) / 2)) & 255; break
        case 4: pixels[dst + x] = (byte + paethPredictor(left, up, upLeft)) & 255; break
        default: throw new Error(`未知 PNG filter=${filter}: ${filePath}`)
      }
    }
    dst += stride
  }

  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * bpp
      let alpha = 255
      if (colorType === 6) alpha = pixels[idx + 3]
      else if (colorType === 3) {
        const paletteIndex = pixels[idx]
        alpha = transparency && paletteIndex < transparency.length
          ? transparency[paletteIndex]
          : 255
      }
      if (alpha > 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < 0 || maxY < 0) {
    minX = 0
    minY = 0
    maxX = width - 1
    maxY = height - 1
  }

  const boundsWidth = maxX - minX + 1
  const boundsHeight = maxY - minY + 1
  const centerX = minX + boundsWidth / 2
  const centerY = minY + boundsHeight / 2
  const mouthX = minX + boundsWidth * 0.88
  const mouthY = minY + boundsHeight * 0.48

  return {
    sourceWidth: width,
    sourceHeight: height,
    bounds: {
      x: minX,
      y: minY,
      width: boundsWidth,
      height: boundsHeight,
    },
    renderOffset: {
      x: centerX - width / 2,
      y: centerY - height / 2,
    },
    centerAnchor: {
      x: centerX / width,
      y: centerY / height,
    },
    mouthAnchor: {
      x: mouthX / width,
      y: mouthY / height,
    },
  }
}

const manifest = {
  version: 2,
  heroesByLevel: {},
  heroEnd: [],
  npcWaves: {},
  boss: { frames: [] },
  trimData: {},
  ui: {},
}

for (const f of safeReadDir(IMAGES_DIR)) {
  const full = join(IMAGES_DIR, f)
  if (!isFile(full) || extname(f).toLowerCase() !== '.png') continue
  manifest.ui[basename(f, '.png')] = toUrlPath(full)
}

for (const level of HERO_LEVELS) {
  const dir = join(HERO_DIR, level)
  if (!isDirectory(dir)) continue
  const frames = naturalSort(
    safeReadDir(dir)
      .filter(name => extname(name).toLowerCase() === '.png' && name.includes('-atk_'))
      .map(name => join(dir, name)),
  )
  manifest.heroesByLevel[level] = {
    atk: frames.map(toUrlPath),
  }
  for (const framePath of frames) {
    manifest.trimData[toUrlPath(framePath)] = parsePngTrim(framePath)
  }
}

if (isDirectory(HERO_END_DIR)) {
  const endFrames = naturalSort(
    safeReadDir(HERO_END_DIR)
      .filter(name => extname(name).toLowerCase() === '.png' && name.includes('-idle_'))
      .map(name => join(HERO_END_DIR, name)),
  )
  manifest.heroEnd = endFrames.map(toUrlPath)
  for (const framePath of endFrames) {
    manifest.trimData[toUrlPath(framePath)] = parsePngTrim(framePath)
  }
}

for (const wave of NPC_WAVES) {
  const dir = join(NPC_DIR, wave)
  if (!isDirectory(dir)) continue
  const frames = naturalSort(
    safeReadDir(dir)
      .filter(name => extname(name).toLowerCase() === '.png' && name.includes('-idle_'))
      .map(name => join(dir, name)),
  )
  manifest.npcWaves[wave] = {
    idle: frames.map(toUrlPath),
  }
  for (const framePath of frames) {
    manifest.trimData[toUrlPath(framePath)] = parsePngTrim(framePath)
  }
}

if (isDirectory(BOSS_DIR)) {
  const bossFrames = naturalSort(
    safeReadDir(BOSS_DIR)
      .filter(name => extname(name).toLowerCase() === '.png')
      .map(name => join(BOSS_DIR, name)),
  )
  manifest.boss.frames = bossFrames.map(toUrlPath)
  for (const framePath of bossFrames) {
    manifest.trimData[toUrlPath(framePath)] = parsePngTrim(framePath)
  }
}

try { mkdirSync(PUBLIC_DIR, { recursive: true }) } catch {}
writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2), 'utf8')

const heroFrames = Object.values(manifest.heroesByLevel).reduce((sum, item) => sum + item.atk.length, 0)
const npcFrames = Object.values(manifest.npcWaves).reduce((sum, item) => sum + item.idle.length, 0)

console.log(`[gen-manifest] hero等级: ${Object.keys(manifest.heroesByLevel).length} | hero帧: ${heroFrames} | npc帧: ${npcFrames}`)
console.log(`[gen-manifest] trimData: ${Object.keys(manifest.trimData).length} | 输出 → ${OUTPUT_PATH}`)
