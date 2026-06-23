import type { HeroLevel, NpcWaveId } from '@/config/progression'

export interface TrimmedFrame {
  sourceWidth: number
  sourceHeight: number
  bounds: { x: number; y: number; width: number; height: number }
  renderOffset: { x: number; y: number }
  centerAnchor: { x: number; y: number }
  mouthAnchor: { x: number; y: number }
}

interface ManifestData {
  version: number
  heroesByLevel: Record<string, { atk: string[] }>
  heroEnd: string[]
  npcWaves: Record<string, { idle: string[] }>
  boss: { url: string }
  trimData: Record<string, TrimmedFrame>
  ui: Record<string, string>
}

let _data: ManifestData | null = null

export const ManifestLoader = {
  init(data: ManifestData): void {
    _data = data
  },

  isReady(): boolean {
    return _data !== null
  },

  getHeroFrames(level: HeroLevel): string[] {
    return _data?.heroesByLevel[level]?.atk ?? []
  },

  getNpcFrames(wave: NpcWaveId): string[] {
    return _data?.npcWaves[wave]?.idle ?? []
  },

  getHeroEndFrames(): string[] {
    return _data?.heroEnd ?? []
  },

  getBossFrame(): string {
    return _data?.boss.url ?? ''
  },

  /**
   * 旧战斗特效接口兼容层。
   * 新版吸食流程不再依赖 eff_atk / eff_hit / eff_ult 帧资源，
   * 这里统一返回空数组，让旧 EffectPlayer 自动降级为代码特效。
   */
  getEffectFrames(_fishId: string, _effectType: string): string[] {
    return []
  },

  getTrimmedFrame(url: string): TrimmedFrame | null {
    return _data?.trimData[url] ?? null
  },

  getVisibleBoundsSize(url: string): { width: number; height: number } | null {
    const trim = _data?.trimData[url]
    if (!trim) return null
    return {
      width: trim.bounds.width,
      height: trim.bounds.height,
    }
  },

  getUiPath(key: string): string {
    return _data?.ui[key] ?? ''
  },
}
