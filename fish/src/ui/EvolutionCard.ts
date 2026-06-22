/**
 * EvolutionCard.ts
 * 底部进化卡片组件，管理 locked → unlocking → unlocked 三态。
 * 样式对齐截图：显示等级要求（Lv.30）、鱼类名称、"已进阶 ✓" 状态标签。
 */

import Phaser from 'phaser'

export type CardState = 'locked' | 'unlocking' | 'unlocked'

const CARD_W = 156
const CARD_H  = 78
const BAR_H   = 4

/** 对齐截图中的进化名称 */
const STAGE_NAMES    = ['食人鱼', '史前蛮鳄', '巨型弹弹鱼', '史前巨鳄']
/** 对应解锁等级 */
const LEVEL_REQUIRED = [30, 60, 90, 120]

export class EvolutionCard {
  private scene:    Phaser.Scene
  private root:     Phaser.GameObjects.Container
  private bg:       Phaser.GameObjects.Rectangle
  private iconCirc: Phaser.GameObjects.Arc
  private mainTxt:  Phaser.GameObjects.Text
  private subTxt:   Phaser.GameObjects.Text
  private barBg:    Phaser.GameObjects.Rectangle
  private barFill:  Phaser.GameObjects.Rectangle

  private cardIndex: number
  private state: CardState = 'locked'

  constructor(
    scene:  Phaser.Scene,
    cx:     number,
    cy:     number,
    index:  number,
    layer:  Phaser.GameObjects.Container,
  ) {
    this.scene     = scene
    this.cardIndex = index

    this.root = scene.add.container(cx, cy)

    // 卡片背景（深蓝紫，对齐截图配色）
    this.bg = scene.add.rectangle(0, 0, CARD_W, CARD_H, 0x0d1535, 0.96)
    this.bg.setStrokeStyle(1.5, 0x2a2a50)

    // 图标圆（locked: 暗色，unlocked: 橙金色）
    this.iconCirc = scene.add.arc(0, -16, 22, 0, 360, false, 0x141830)
    this.iconCirc.setStrokeStyle(1.5, 0x333366)

    // 主文字：locked 显示等级要求，unlocked 显示鱼类名
    this.mainTxt = scene.add.text(0, +8, `Lv.${LEVEL_REQUIRED[index]}`, {
      fontSize: '14px',
      color: '#666688',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 副文字：locked "未解锁"，unlocked "已进阶 ✓"
    this.subTxt = scene.add.text(0, +26, '未解锁', {
      fontSize: '10px',
      color: '#444466',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5)

    // 进度条背景（4px，紧贴底边）
    const barY = CARD_H / 2 - BAR_H / 2 - 1
    this.barBg = scene.add.rectangle(0, barY, CARD_W - 12, BAR_H, 0x1a1a3a)
    this.barBg.setOrigin(0.5)

    // 进度条填充（初始宽度 0，左对齐）
    this.barFill = scene.add.rectangle(-(CARD_W - 12) / 2, barY, 0, BAR_H, 0x3366dd)
    this.barFill.setOrigin(0, 0.5)

    this.root.add([this.bg, this.barBg, this.barFill, this.iconCirc, this.mainTxt, this.subTxt])
    layer.add(this.root)
  }

  /** 设置卡片状态；locked→unlocked 会播放解锁动画 */
  setState(state: CardState): void {
    if (this.state === state) return
    const prev = this.state
    this.state = state

    if (state === 'unlocking' || (prev === 'locked' && state === 'unlocked')) {
      this.playUnlockAnim()
    } else if (state === 'unlocked') {
      this.applyUnlocked()
    }
  }

  /** 更新经验进度（0–1），带 tween 过渡 */
  setProgress(progress: number): void {
    const p = Phaser.Math.Clamp(progress, 0, 1)
    const maxW = CARD_W - 12

    this.scene.tweens.add({
      targets: this.barFill,
      width: maxW * p,
      duration: 300,
      ease: 'Sine.easeOut',
    })

    // 进度条接近满格时高亮提示
    if (p >= 0.95) {
      this.barFill.setFillStyle(0xffcc44)
      this.scene.tweens.add({
        targets: this.barFill,
        alpha: 0.6,
        duration: 200,
        yoyo: true,
        repeat: 2,
      })
    }
  }

  destroy(): void {
    this.root.destroy(true)
  }

  // ────────────────────────────────────────────────────────────────

  private playUnlockAnim(): void {
    this.bg.setFillStyle(0x1a2860)
    this.bg.setStrokeStyle(2, 0xffd700)

    this.scene.tweens.add({
      targets: this.root,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 120,
      ease: 'Sine.easeOut',
      yoyo: true,
      onComplete: () => {
        this.root.setScale(1)
        this.applyUnlocked()
      },
    })
  }

  private applyUnlocked(): void {
    const idx = this.cardIndex

    this.bg.setFillStyle(0x1a2860)
    this.bg.setStrokeStyle(2, 0xffd700)

    // 图标圆变橙金色
    this.iconCirc.setFillStyle(0xcc6600)
    this.iconCirc.setStrokeStyle(1.5, 0xffaa44)

    // 主文字变鱼名（金色）
    this.mainTxt.setText(STAGE_NAMES[idx] ?? '进化完成')
    this.mainTxt.setColor('#ffd700')

    // 副文字变"已进阶 ✓"（绿色）
    this.subTxt.setText('已进阶 ✓')
    this.subTxt.setColor('#44ff88')

    // 进度条填满并变金色
    const maxW = CARD_W - 12
    this.scene.tweens.add({
      targets: this.barFill,
      width: maxW,
      duration: 200,
      ease: 'Sine.easeOut',
    })
    this.barFill.setFillStyle(0xffd700)
  }
}
