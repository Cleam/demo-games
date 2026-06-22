/**
 * BossHpBar.ts
 * Boss 血条组件（仅 win 模式，BossLayer=HUD 层）。
 * 初始隐藏，showBoss 事件时显示；updateBossHp 驱动填充动画。
 */

import Phaser from 'phaser'

const BAR_W   = 440
const BAR_H   = 18
const CENTER_X = 0   // 相对于父容器坐标
const CENTER_Y = 0

export class BossHpBar {
  private scene:      Phaser.Scene
  private root:       Phaser.GameObjects.Container
  private fill:       Phaser.GameObjects.Rectangle
  private nameTxt:    Phaser.GameObjects.Text
  private percentTxt: Phaser.GameObjects.Text
  private currentPct = 1

  constructor(scene: Phaser.Scene, x: number, y: number, layer: Phaser.GameObjects.Container) {
    this.scene = scene
    this.root  = scene.add.container(x, y)
    this.root.setVisible(false)

    // 标签背景
    const labelBg = scene.add.rectangle(CENTER_X, -20, BAR_W + 20, 28, 0x000000, 0.55)

    // Boss 名称
    this.nameTxt = scene.add.text(CENTER_X - BAR_W / 2 + 6, -20, '鱼皇', {
      fontSize: '14px',
      color: '#ff4444',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5)

    // 血量百分比
    this.percentTxt = scene.add.text(CENTER_X + BAR_W / 2 - 4, -20, '100%', {
      fontSize: '13px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(1, 0.5)

    // 条背景
    const barBg = scene.add.rectangle(CENTER_X, CENTER_Y, BAR_W, BAR_H, 0x111122)
    barBg.setStrokeStyle(1, 0x333355)

    // 条分段纹理（视觉用）
    const segments = scene.add.graphics()
    segments.lineStyle(1, 0x000000, 0.3)
    for (let i = 1; i < 10; i++) {
      const x = CENTER_X - BAR_W / 2 + (BAR_W / 10) * i
      segments.lineBetween(x, CENTER_Y - BAR_H / 2, x, CENTER_Y + BAR_H / 2)
    }

    // 填充
    this.fill = scene.add.rectangle(CENTER_X - BAR_W / 2, CENTER_Y, BAR_W, BAR_H, 0xcc2222)
    this.fill.setOrigin(0, 0.5)

    this.root.add([labelBg, barBg, segments, this.fill, this.nameTxt, this.percentTxt])
    layer.add(this.root)
  }

  show(): void {
    this.root.setVisible(true)
    this.root.setAlpha(0)
    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      duration: 300,
      ease: 'Sine.easeOut',
    })
  }

  hide(): void {
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      duration: 200,
      ease: 'Sine.easeIn',
      onComplete: () => this.root.setVisible(false),
    })
  }

  /** 设置血量百分比（0–1），带渐变动画 */
  setPercent(percent: number): void {
    const p = Phaser.Math.Clamp(percent, 0, 1)
    this.currentPct = p

    const targetW = BAR_W * p
    this.scene.tweens.add({
      targets: this.fill,
      width: targetW,
      duration: 600,
      ease: 'Sine.easeOut',
    })

    this.percentTxt.setText(`${Math.round(p * 100)}%`)

    // 血量低时变黄再变红
    const color = p > 0.5 ? 0xcc2222 : p > 0.2 ? 0xdd8800 : 0xff4400
    this.fill.setFillStyle(color)
  }

  destroy(): void {
    this.root.destroy(true)
  }
}
