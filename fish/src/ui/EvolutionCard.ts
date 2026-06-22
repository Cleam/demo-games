/**
 * EvolutionCard.ts
 * 底部进化卡片组件，管理 locked → unlocking → unlocked 三态。
 * 每个卡片是一个 Phaser.GameObjects.Container 加入 evolutionLayer。
 */

import Phaser from 'phaser'

export type CardState = 'locked' | 'unlocking' | 'unlocked'

const CARD_W = 156
const CARD_H = 78
const BAR_H  = 6

/** 各阶段的显示名称（win 模式按解锁顺序对应 evolution_1~final_actor） */
const STAGE_NAMES = ['银鱼', '金甲鱼', '王者鱼', '鱼王']

export class EvolutionCard {
  private scene:    Phaser.Scene
  private root:     Phaser.GameObjects.Container
  private bg:       Phaser.GameObjects.Rectangle
  private labelTxt: Phaser.GameObjects.Text
  private stateTxt: Phaser.GameObjects.Text
  private barBg:    Phaser.GameObjects.Rectangle
  private barFill:  Phaser.GameObjects.Rectangle
  private iconCirc: Phaser.GameObjects.Arc

  private cardIndex: number
  private state: CardState = 'locked'
  private progress = 0

  constructor(
    scene:  Phaser.Scene,
    cx:     number,
    cy:     number,
    index:  number,
    layer:  Phaser.GameObjects.Container,
  ) {
    this.scene = scene
    this.cardIndex = index

    this.root = scene.add.container(cx, cy)

    // 背景
    this.bg = scene.add.rectangle(0, 0, CARD_W, CARD_H, 0x141428, 0.92)
    this.bg.setStrokeStyle(1.5, 0x2a2a50)

    // 鱼类图标占位（小圆）
    this.iconCirc = scene.add.arc(0, -12, 18, 0, 360, false, 0x2a3060)
    this.iconCirc.setStrokeStyle(1, 0x444466)

    // "?" 文字（locked 时显示）
    const questionMark = scene.add.text(0, -12, '?', {
      fontSize: '18px',
      color: '#444466',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 进化名称（unlocked 时显示真实名称）
    this.labelTxt = scene.add.text(0, 12, `进化 ${index + 1}`, {
      fontSize: '13px',
      color: '#444466',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 状态标签
    this.stateTxt = scene.add.text(0, 26, '未解锁', {
      fontSize: '10px',
      color: '#333355',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5)

    // 经验进度条背景
    this.barBg = scene.add.rectangle(0, CARD_H / 2 - BAR_H / 2 - 1, CARD_W - 12, BAR_H, 0x1a1a3a)
    this.barBg.setOrigin(0.5)

    // 经验进度条填充（初始宽度为 0）
    this.barFill = scene.add.rectangle(
      -(CARD_W - 12) / 2, CARD_H / 2 - BAR_H / 2 - 1,
      0, BAR_H, 0x2255cc,
    )
    this.barFill.setOrigin(0, 0.5)

    this.root.add([this.bg, this.barBg, this.barFill, this.iconCirc, questionMark, this.labelTxt, this.stateTxt])
    layer.add(this.root)
  }

  /** 设置卡片状态，locked→unlocked 会播放解锁动画 */
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
    this.progress = Phaser.Math.Clamp(progress, 0, 1)
    const maxW = CARD_W - 12
    const targetW = maxW * this.progress

    this.scene.tweens.add({
      targets: this.barFill,
      width: targetW,
      duration: 300,
      ease: 'Sine.easeOut',
    })

    // 进度条填满时高亮提示
    if (this.progress >= 0.95) {
      this.barFill.setFillStyle(0x00ccff)
      this.scene.tweens.add({
        targets: this.barFill,
        alpha: 0.6,
        duration: 200,
        yoyo: true,
        repeat: 2,
      })
    }
  }

  /** 销毁卡片（场景重启时调用） */
  destroy(): void {
    this.root.destroy(true)
  }

  // ────────────────────────────────────────────────────────────────

  private playUnlockAnim(): void {
    // 高亮闪烁 + 缩放弹入
    this.bg.setFillStyle(0x1e3080)
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
    const idx = this.getCurrentIndex()

    this.bg.setFillStyle(0x1a3060)
    this.bg.setStrokeStyle(2, 0xffd700)
    this.iconCirc.setFillStyle(0x3366cc)
    this.iconCirc.setStrokeStyle(1.5, 0x66aaff)

    this.labelTxt.setText(STAGE_NAMES[idx] ?? '进化完成')
    this.labelTxt.setColor('#ffd700')
    this.labelTxt.setStyle({ fontStyle: 'bold' })

    this.stateTxt.setText('✓ 已解锁')
    this.stateTxt.setColor('#00ee88')

    // 进度条填满
    const maxW = CARD_W - 12
    this.scene.tweens.add({
      targets: this.barFill,
      width: maxW,
      duration: 200,
      ease: 'Sine.easeOut',
    })
    this.barFill.setFillStyle(0xffd700)
  }

  private getCurrentIndex(): number {
    return this.cardIndex
  }
}
