/**
 * assetMapping.ts
 * 流程角色槽位 → fish ID 映射 + 每个角色的位置、缩放、帧率配置。
 * 所有业务代码通过槽位名称引用角色，不直接硬编码 fish ID。
 */

// ── 槽位类型 ─────────────────────────────────────────────────────────

export type CharacterSlot =
  | 'starter'
  | 'evolution_1'
  | 'evolution_2'
  | 'evolution_3'
  | 'final_actor'
  | 'boss_win'
  | 'enemy_lose'

// ── 默认帧率 ─────────────────────────────────────────────────────────

/** 各动作默认播放帧率（fps）。通过 slotConfig.frameRateOverrides 覆盖。 */
export const DEFAULT_FRAME_RATES: Record<string, number> = {
  idle: 12,
  move: 15,
  atk:  15,
  ult:  12,
  ultb: 10,
  die:  10,
}

// ── 槽位配置结构 ─────────────────────────────────────────────────────

export interface SlotConfig {
  /** fish ID，对应 assets/images/ 下的目录名 */
  fishId: string
  /** 战斗区 X 坐标（设计尺寸 720×1280，精灵中心点） */
  x: number
  /** 战斗区 Y 坐标 */
  y: number
  /** 精灵缩放倍数（待视觉测试后调整） */
  scale: number
  /** true = 水平翻转（敌方角色面向左侧） */
  flipX: boolean
  /** 覆盖特定动作的帧率，未指定的继续使用 DEFAULT_FRAME_RATES */
  frameRateOverrides: Record<string, number>
}

// ── 槽位映射表 ───────────────────────────────────────────────────────
// 坐标和缩放为初始估算值，Stage 7 视觉打磨时统一调整

export const slotConfig: Record<CharacterSlot, SlotConfig> = {
  starter: {
    fishId: 'fish_11002',
    x: 280, y: 670,
    scale: 0.55,
    flipX: false,
    frameRateOverrides: {},
  },
  evolution_1: {
    fishId: 'fish_11003',
    x: 280, y: 665,
    scale: 0.55,
    flipX: false,
    frameRateOverrides: {},
  },
  evolution_2: {
    fishId: 'fish_15101',
    x: 275, y: 660,
    scale: 0.52,
    flipX: false,
    // fish_15101 idle 只有 30 帧，循环稍快避免卡顿感
    frameRateOverrides: { idle: 10, move: 12 },
  },
  evolution_3: {
    fishId: 'fish_15102',
    x: 278, y: 660,
    scale: 0.54,
    flipX: false,
    frameRateOverrides: {},
  },
  final_actor: {
    fishId: 'fish_14104',
    x: 270, y: 650,
    scale: 0.72,
    flipX: false,
    // fish_14104 画布较窄（696px）需要更大 scale 才能显眼；ult 75 帧稍慢
    frameRateOverrides: { ult: 10 },
  },
  boss_win: {
    fishId: 'skin_fish_151011',
    x: 500, y: 610,
    scale: 0.48,
    flipX: true,     // 面向左侧（朝向玩家）
    // skin_fish_151011 画布极宽（1996px）且 idle 只有 30 帧
    frameRateOverrides: { idle: 10, move: 12 },
  },
  enemy_lose: {
    fishId: 'fish_13201',
    x: 490, y: 640,
    scale: 0.42,
    flipX: true,     // 面向左侧（朝向玩家）
    // fish_13201 为方形画布（1562×1562）
    frameRateOverrides: {},
  },
}

// ── 工具函数 ─────────────────────────────────────────────────────────

export function getFishId(slot: CharacterSlot): string {
  return slotConfig[slot].fishId
}

export function getEffectiveFrameRate(slot: CharacterSlot, action: string): number {
  const cfg = slotConfig[slot]
  return cfg.frameRateOverrides[action] ?? DEFAULT_FRAME_RATES[action] ?? 12
}

/** 游戏流程中需要预加载的角色列表（不含 enemy/boss） */
export const PLAYER_SLOTS: CharacterSlot[] = [
  'starter', 'evolution_1', 'evolution_2', 'evolution_3', 'final_actor',
]

/** win 模式需要加载的全部槽位 */
export const WIN_MODE_SLOTS: CharacterSlot[] = [...PLAYER_SLOTS, 'boss_win']

/** lose 模式需要加载的全部槽位 */
export const LOSE_MODE_SLOTS: CharacterSlot[] = [...PLAYER_SLOTS, 'enemy_lose']
