/**
 * Actor.ts
 * 场景角色基类，封装帧动画播放、位置管理和动作降级逻辑。
 *
 * 使用方式：
 *   const actor = new Actor(scene, 'starter', battleLayer)
 *   actor.spawn()          // 显示并开始 idle 动画
 *   actor.attack(onDone)   // 播放攻击，结束后自动回到 idle
 *   actor.die(onDone)      // 播放死亡
 *   actor.exit()           // 淡出后销毁
 */

import Phaser from 'phaser'
import { type CharacterSlot, slotConfig, getEffectiveFrameRate } from '@/config/assetMapping'
import { ManifestLoader } from '@/utils/ManifestLoader'
import { FrameAnimPlayer, type PlayOptions } from './FrameAnimPlayer'

export class Actor {
  private scene:   Phaser.Scene
  private slot:    CharacterSlot
  private layer:   Phaser.GameObjects.Container
  readonly player: FrameAnimPlayer

  /** 各动作帧路径缓存，spawn() 时从 ManifestLoader 填充 */
  private heroFrames: Record<string, string[]> = {}
  private moveTween?: Phaser.Tweens.Tween

  constructor(
    scene: Phaser.Scene,
    slot:  CharacterSlot,
    layer: Phaser.GameObjects.Container,
  ) {
    this.scene  = scene
    this.slot   = slot
    this.layer  = layer
    this.player = new FrameAnimPlayer(scene)
    // 将 FrameAnimPlayer 的 Image 移入目标层容器
    this.layer.add(this.player.gameObject)
  }

  /**
   * 初始化角色：应用配置的位置/缩放/翻转，缓存帧路径，播放 idle。
   * 首次 idle 会触发动态纹理加载，加载完成后角色自动出现。
   */
  spawn(): void {
    const cfg = slotConfig[this.slot]
    const img = this.player.gameObject

    img.setPosition(cfg.x, cfg.y)
    img.setScale(cfg.scale)
    img.setFlipX(cfg.flipX)
    img.setAlpha(1)

    // 缓存所有可用动作帧
    const fishId = cfg.fishId
    for (const action of ['idle', 'move', 'atk', 'ult', 'ultb', 'die']) {
      const frames = ManifestLoader.getHeroFrames(fishId, action)
      if (frames.length > 0) this.heroFrames[action] = frames
    }

    this.idle()
  }

  idle(): void {
    this.play('idle', { loop: true })
  }

  /** 平移到目标 X 坐标，期间播放 move 动画，到达后自动切回 idle */
  move(toX: number, duration: number): void {
    this.moveTween?.stop()
    this.play('move', { loop: true })
    this.moveTween = this.scene.tweens.add({
      targets: this.player.gameObject,
      x: toX,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.moveTween = undefined
        this.idle()
      },
    })
  }

  /** 播放攻击动画，结束后回到 idle；可选 onComplete 回调 */
  attack(onComplete?: () => void): void {
    this.play('atk', {
      loop: false,
      onComplete: () => {
        this.idle()
        onComplete?.()
      },
    })
  }

  /** 播放大招动画（ult），无 ult 时降级到 atk */
  ultimate(onComplete?: () => void): void {
    const action = this.heroFrames['ult'] ? 'ult' : 'atk'
    this.play(action, {
      loop: false,
      onComplete: () => {
        this.idle()
        onComplete?.()
      },
    })
  }

  /**
   * 受击反馈：白闪 + 横向抖动（不切换动画，效果叠加在当前动作上）。
   * Stage 7 将叠加真实的 eff_hit 帧序列特效。
   */
  hit(): void {
    const img    = this.player.gameObject
    const origX  = img.x

    this.scene.tweens.add({
      targets: img,
      alpha: 0.15,
      duration: 55,
      yoyo: true,
      ease: 'Linear',
    })
    this.scene.tweens.add({
      targets: img,
      x: origX + 10,
      duration: 38,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => { img.x = origX },
    })
  }

  /** 播放死亡动画，结束后停在最后一帧；可选 onComplete 回调 */
  die(onComplete?: () => void): void {
    this.play('die', { loop: false, onComplete })
  }

  /** 淡出（300ms）后执行回调；通常配合 destroy() 使用 */
  exit(onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this.player.gameObject,
      alpha: 0,
      duration: 300,
      ease: 'Sine.easeIn',
      onComplete: () => onComplete?.(),
    })
  }

  destroy(): void {
    this.moveTween?.stop()
    this.scene.tweens.killTweensOf(this.player.gameObject)
    this.player.destroy()
  }

  get x(): number { return this.player.gameObject.x }
  get y(): number { return this.player.gameObject.y }

  // ── 内部 ──────────────────────────────────────────────────────────

  private play(action: string, extras: Omit<PlayOptions, 'frameRate'>): void {
    const frames = this.resolveFrames(action)
    if (frames.length === 0) {
      console.warn(`[Actor ${this.slot}] 无可用帧: ${action}，已跳过`)
      return
    }
    const fps = getEffectiveFrameRate(this.slot, action)
    this.player.play(frames, { frameRate: fps, ...extras })
  }

  /**
   * 按 GAME_FLOW.md §3.4 降级规则解析帧列表。
   * 优先返回目标动作帧；缺失时按规则降级，最坏情况使用 idle。
   */
  private resolveFrames(action: string): string[] {
    if (this.heroFrames[action]?.length) return this.heroFrames[action]

    switch (action) {
      case 'idle': {
        // 降级：取 atk 第一帧静止显示
        const atk = this.heroFrames['atk']
        return atk ? [atk[0]] : []
      }
      case 'move':
        return this.heroFrames['idle'] ?? []
      case 'atk':
        return this.heroFrames['ult'] ?? this.heroFrames['idle'] ?? []
      case 'ult':
        return this.heroFrames['atk'] ?? this.heroFrames['idle'] ?? []
      case 'die': {
        // 降级：取 atk 最后一帧
        const atk = this.heroFrames['atk']
        return atk ? [atk[atk.length - 1]] : this.heroFrames['idle']?.slice(-1) ?? []
      }
      default:
        return this.heroFrames['idle'] ?? []
    }
  }
}
