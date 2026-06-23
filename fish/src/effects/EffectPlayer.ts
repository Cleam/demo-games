/**
 * EffectPlayer.ts
 * 特效帧序列播放器，在 EffectLayer 上创建临时图像对象。
 *
 * 使用方式：
 *   effectPlayer.play(fishId, 'eff_atk', actor.x, actor.y)
 *   effectPlayer.play(fishId, 'eff_hit', actor.x, actor.y)
 *   effectPlayer.play(fishId, 'eff_ult', actor.x, actor.y, 0.4)
 *
 * 降级策略：无帧资源时自动播放程序生成的圆圈扩散特效。
 */

import Phaser from 'phaser'
import { ManifestLoader } from '@/utils/ManifestLoader'
import { FrameAnimPlayer } from '@/game/actors/FrameAnimPlayer'

export type EffectType = 'eff_atk' | 'eff_hit' | 'eff_ult'

/** 特效缩放配置（特效图普遍在 2000×2000 级别，默认缩放到合适大小） */
const EFF_SCALE: Record<EffectType, number> = {
  eff_atk: 0.28,
  eff_hit: 0.24,
  eff_ult: 0.38,
}

/** 特效帧率 */
const EFF_FPS: Record<EffectType, number> = {
  eff_atk: 24,
  eff_hit: 20,
  eff_ult: 22,
}

/** 降级颜色 */
const FALLBACK_COLOR: Record<EffectType, number> = {
  eff_atk: 0xffffff,
  eff_hit: 0xff4444,
  eff_ult: 0xffdd00,
}

export class EffectPlayer {
  private scene:          Phaser.Scene
  private layer:          Phaser.GameObjects.Container
  private activeEffects:  FrameAnimPlayer[] = []

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Container) {
    this.scene = scene
    this.layer = layer
  }

  /**
   * 在角色位置播放特效帧序列。
   * - 若 manifest 中有对应帧则优先使用真实素材
   * - 否则降级为程序生成的圆圈扩散
   * @param fishId  角色鱼 ID（如 'fish_14104'）
   * @param effType 特效类型
   * @param x       世界坐标 X（相对 layer 父容器）
   * @param y       世界坐标 Y
   * @param scaleOverride 可选缩放覆盖（默认按 EFF_SCALE 表）
   */
  play(
    fishId:        string,
    effType:       EffectType,
    x:             number,
    y:             number,
    scaleOverride?: number,
  ): void {
    const frames = ManifestLoader.getEffectFrames(fishId, effType)

    if (frames.length === 0) {
      this.playFallback(x, y, effType)
      return
    }

    const scale = scaleOverride ?? EFF_SCALE[effType]
    const fps   = EFF_FPS[effType]

    const player = new FrameAnimPlayer(this.scene)
    this.layer.add(player.gameObject)

    // 特效以角色为中心，FlipX = false（特效通常方向无关）
    player.gameObject.setPosition(x, y)
    player.gameObject.setScale(scale)

    this.activeEffects.push(player)

    player.play(frames, {
      frameRate:  fps,
      loop:       false,
      onComplete: () => {
        player.destroy()
        this.activeEffects = this.activeEffects.filter(p => p !== player)
      },
    })
  }

  /** 停止并销毁所有正在播放的特效（场景关闭或 retry 时调用） */
  destroyAll(): void {
    for (const p of this.activeEffects) p.destroy()
    this.activeEffects = []
  }

  // ────────────────────────────────────────────────────────────────

  /**
   * 程序降级特效：
   * - eff_atk：白色射线 + 小命中环
   * - eff_hit：红白双环 + 火花
   * - eff_ult：大范围金色闪爆
   */
  private playFallback(x: number, y: number, effType: EffectType): void {
    const color = FALLBACK_COLOR[effType]
    const g = this.scene.add.graphics().setPosition(x, y)
    this.layer.add(g)

    if (effType === 'eff_atk') {
      g.lineStyle(4, 0xffffff, 0.95)
      g.lineBetween(-38, -8, 42, -2)
      g.lineBetween(-34, 4, 40, 12)
      g.lineStyle(2, 0xbfefff, 0.7)
      g.strokeCircle(44, 0, 14)
      g.strokeCircle(44, 0, 24)
    } else if (effType === 'eff_hit') {
      g.lineStyle(4, 0xffffff, 0.9)
      g.strokeCircle(0, 0, 22)
      g.lineStyle(3, 0xff6767, 0.9)
      g.strokeCircle(0, 0, 34)
      for (const [sx, sy] of [[-24, -10], [18, -22], [28, 12], [-16, 24]] as const) {
        g.lineBetween(sx, sy, sx * 1.4, sy * 1.4)
      }
    } else {
      g.fillStyle(0xfff2aa, 0.42)
      g.fillCircle(0, 0, 48)
      g.lineStyle(4, color, 0.95)
      g.strokeCircle(0, 0, 66)
      g.lineStyle(3, 0xffffff, 0.7)
      for (const [x1, y1, x2, y2] of [[-78, 0, 78, 0], [0, -78, 0, 78], [-56, -56, 56, 56], [-56, 56, 56, -56]] as const) {
        g.lineBetween(x1, y1, x2, y2)
      }
    }

    this.scene.tweens.add({
      targets: g,
      scaleX: effType === 'eff_ult' ? 1.8 : 1.25,
      scaleY: effType === 'eff_ult' ? 1.8 : 1.25,
      alpha: 0,
      duration: effType === 'eff_ult' ? 460 : 280,
      ease: 'Sine.easeOut',
      onComplete: () => g.destroy(),
    })
  }
}
