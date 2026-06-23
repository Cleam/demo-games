/**
 * BossHpBar.ts
 * 胜利模式顶部 Boss 血条，名称来自角色配置。
 */

import Phaser from 'phaser'
import { type CharacterSlot, getCharacterConfig } from '@/config/assetMapping'

const BAR_W = 470
const BAR_H = 18

export class BossHpBar {
  private scene: Phaser.Scene
  private root: Phaser.GameObjects.Container
  private fill: Phaser.GameObjects.Rectangle
  private nameTxt: Phaser.GameObjects.Text
  private percentTxt: Phaser.GameObjects.Text

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    layer: Phaser.GameObjects.Container,
    slot: CharacterSlot = 'boss_win',
  ) {
    this.scene = scene
    this.root = scene.add.container(x, y)
    this.root.setVisible(false)

    const cfg = getCharacterConfig(slot)
    const plate = scene.add.graphics()
    plate.fillStyle(0x1e2a5d, 0.96)
    plate.fillRoundedRect(-BAR_W / 2 - 24, -28, BAR_W + 48, 34, 16)
    plate.lineStyle(3, 0x7b8fe3, 0.95)
    plate.strokeRoundedRect(-BAR_W / 2 - 24, -28, BAR_W + 48, 34, 16)

    const labelTxt = scene.add.text(-BAR_W / 2 - 10, -11, cfg.displayName, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5)

    this.percentTxt = scene.add.text(BAR_W / 2 + 12, -11, '100%', {
      fontSize: '15px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5)

    const barBg = scene.add.rectangle(0, 14, BAR_W, BAR_H, 0x233768)
    barBg.setStrokeStyle(2, 0x90b4ff, 0.8)

    const barGlow = scene.add.rectangle(0, 14, BAR_W, BAR_H + 8, 0xff4d55, 0.12)
    this.fill = scene.add.rectangle(-BAR_W / 2, 14, BAR_W, BAR_H, 0xeb4048).setOrigin(0, 0.5)
    this.nameTxt = labelTxt

    this.root.add([plate, barGlow, barBg, this.fill, this.nameTxt, this.percentTxt])
    layer.add(this.root)
  }

  show(): void {
    this.root.setVisible(true)
    this.root.setAlpha(0)
    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      duration: 280,
      ease: 'Sine.easeOut',
    })
  }

  hide(): void {
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      duration: 180,
      ease: 'Sine.easeIn',
      onComplete: () => this.root.setVisible(false),
    })
  }

  setPercent(percent: number): void {
    const p = Phaser.Math.Clamp(percent, 0, 1)
    const width = BAR_W * p

    this.scene.tweens.add({
      targets: this.fill,
      width,
      duration: 500,
      ease: 'Sine.easeOut',
    })

    this.percentTxt.setText(`${Math.round(p * 100)}%`)
    this.fill.setFillStyle(p > 0.5 ? 0xeb4048 : p > 0.2 ? 0xf59d28 : 0xffdf6b)
  }

  destroy(): void {
    this.root.destroy(true)
  }
}
