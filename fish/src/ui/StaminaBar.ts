/**
 * StaminaBar.ts
 * 失败模式体力条（HUD 层）。
 * showStamina 事件时显示；updateStamina 驱动填充动画和颜色变化。
 */

import Phaser from 'phaser'

const BAR_W = 380
const BAR_H  = 16

export class StaminaBar {
  private scene: Phaser.Scene
  private root:  Phaser.GameObjects.Container
  private fill:  Phaser.GameObjects.Rectangle
  private percentTxt: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene, x: number, y: number, layer: Phaser.GameObjects.Container) {
    this.scene = scene
    this.root  = scene.add.container(x, y)
    this.root.setVisible(false)

    // 标签背景条
    const labelBg = scene.add.rectangle(0, -18, BAR_W + 20, 26, 0x000000, 0.55)

    const labelTxt = scene.add.text(-BAR_W / 2 + 4, -18, '体力', {
      fontSize: '13px',
      color: '#44cc44',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5)

    this.percentTxt = scene.add.text(BAR_W / 2 - 4, -18, '100%', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(1, 0.5)

    // 条背景
    const barBg = scene.add.rectangle(0, 0, BAR_W, BAR_H, 0x111122)
    barBg.setStrokeStyle(1, 0x333355)

    // 填充（初始满格，绿色，左对齐）
    this.fill = scene.add.rectangle(-BAR_W / 2, 0, BAR_W, BAR_H, 0x22cc44)
    this.fill.setOrigin(0, 0.5)

    this.root.add([labelBg, barBg, this.fill, labelTxt, this.percentTxt])
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

  /** 设置体力百分比（0–1），带渐变动画；低体力时变红 */
  setPercent(percent: number): void {
    const p = Phaser.Math.Clamp(percent, 0, 1)
    const targetW = BAR_W * p

    this.scene.tweens.add({
      targets: this.fill,
      width: targetW,
      duration: 600,
      ease: 'Sine.easeOut',
    })

    this.percentTxt.setText(`${Math.round(p * 100)}%`)

    const color = p > 0.5 ? 0x22cc44 : p > 0.2 ? 0xddaa00 : 0xff3322
    this.fill.setFillStyle(color)
  }

  destroy(): void {
    this.root.destroy(true)
  }
}
