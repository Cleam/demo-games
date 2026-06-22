/**
 * LoseModal.ts
 * 失败弹窗（ModalLayer）。
 * showResult 事件触发后显示；提供"重新挑战"和"退出挑战"两个按钮。
 */

import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/constants'

const CARD_W = 580
const CARD_H  = 460
const CARD_Y  = GAME_HEIGHT / 2 - 40

export class LoseModal {
  private scene: Phaser.Scene
  private root:  Phaser.GameObjects.Container

  constructor(
    scene:   Phaser.Scene,
    layer:   Phaser.GameObjects.Container,
    onRetry: () => void,
    onExit:  () => void,
  ) {
    this.scene = scene
    this.root  = scene.add.container(GAME_WIDTH / 2, 0)
    this.root.setVisible(false)

    // 全屏遮罩
    const overlay = scene.add.rectangle(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88)

    // 弹窗主体（红色系）
    const card = scene.add.rectangle(0, CARD_Y, CARD_W, CARD_H, 0x180808)
    card.setStrokeStyle(2, 0xcc2222)

    // 顶部装饰条
    const topBar = scene.add.rectangle(0, CARD_Y - CARD_H / 2 + 16, CARD_W, 32, 0xcc2222, 0.22)

    // 标题
    const titleTxt = scene.add.text(0, CARD_Y - CARD_H / 2 + 58, '失败了！', {
      fontSize: '36px',
      color: '#ff4444',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 副标题
    const subtitleTxt = scene.add.text(0, CARD_Y - CARD_H / 2 + 108, '再试一次吧', {
      fontSize: '18px',
      color: '#aa6666',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5)

    // 图标区（红色圆 + X 标志）
    const iconY = CARD_Y - 24
    const iconCirc = scene.add.arc(0, iconY, 54, 0, 360, false, 0x2a0808)
    iconCirc.setStrokeStyle(3, 0xaa2222)
    const iconX = scene.add.text(0, iconY, '✕', {
      fontSize: '48px',
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 主按钮：重新挑战
    const retryBtnY = CARD_Y + CARD_H / 2 - 116
    const retryBg   = scene.add.rectangle(0, retryBtnY, 320, 68, 0xdd3333)
    retryBg.setStrokeStyle(2, 0xff6666)
    const retryTxt = scene.add.text(0, retryBtnY, '重新挑战', {
      fontSize: '26px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    retryBg.setInteractive({ useHandCursor: true })
    retryBg.on('pointerover', () => retryBg.setFillStyle(0xff4444))
    retryBg.on('pointerout',  () => retryBg.setFillStyle(0xdd3333))
    retryBg.on('pointerdown', () => {
      retryBg.disableInteractive()
      exitBg.disableInteractive()
      scene.tweens.add({
        targets: [retryBg, retryTxt],
        scaleX: 0.93, scaleY: 0.93,
        duration: 80, yoyo: true,
        onComplete: () => onRetry(),
      })
    })

    // 次按钮：退出挑战
    const exitBtnY = CARD_Y + CARD_H / 2 - 50
    const exitBg   = scene.add.rectangle(0, exitBtnY, 260, 52, 0x242424)
    exitBg.setStrokeStyle(1, 0x555555)
    const exitTxt = scene.add.text(0, exitBtnY, '退出挑战', {
      fontSize: '20px',
      color: '#888888',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5)

    exitBg.setInteractive({ useHandCursor: true })
    exitBg.on('pointerover', () => exitBg.setFillStyle(0x333333))
    exitBg.on('pointerout',  () => exitBg.setFillStyle(0x242424))
    exitBg.on('pointerdown', () => {
      retryBg.disableInteractive()
      exitBg.disableInteractive()
      scene.tweens.add({
        targets: [exitBg, exitTxt],
        scaleX: 0.93, scaleY: 0.93,
        duration: 80, yoyo: true,
        onComplete: () => onExit(),
      })
    })

    this.root.add([overlay, card, topBar, titleTxt, subtitleTxt, iconCirc, iconX, retryBg, retryTxt, exitBg, exitTxt])
    layer.add(this.root)
  }

  show(): void {
    this.root.setVisible(true)
    this.root.setAlpha(0)
    this.root.setScale(0.9)
    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 350,
      ease: 'Back.easeOut',
    })
  }

  hide(): void {
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      duration: 250,
      ease: 'Sine.easeIn',
      onComplete: () => this.root.setVisible(false),
    })
  }

  destroy(): void {
    this.root.destroy(true)
  }
}
