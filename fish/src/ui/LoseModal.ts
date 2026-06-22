/**
 * LoseModal.ts
 * 失败弹窗（ModalLayer）。
 * 样式对齐截图 lose07：标题"挑战失败"，副标题金色，绿色重试按钮。
 */

import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/constants'

const CARD_W = 580
const CARD_H  = 460
const CARD_Y  = GAME_HEIGHT / 2 - 40  // 600

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

    // 弹窗主体（深蓝色系，对齐截图）
    const card = scene.add.rectangle(0, CARD_Y, CARD_W, CARD_H, 0x070e28)
    card.setStrokeStyle(2, 0x2233aa)

    // 顶部装饰条
    const topBar = scene.add.rectangle(0, CARD_Y - CARD_H / 2 + 16, CARD_W, 32, 0x2233aa, 0.25)

    // 标题 "挑战失败"（白色大字）
    const titleTxt = scene.add.text(0, CARD_Y - CARD_H / 2 + 62, '挑战失败', {
      fontSize: '38px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 副标题（金色）
    const subtitleTxt = scene.add.text(0, CARD_Y - CARD_H / 2 + 114, '你的体力需要加强', {
      fontSize: '20px',
      color: '#ffcc44',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5)

    // 灰色小鱼轮廓图标（代表玩家鱼倒下，缺少真实素材）
    const iconY = CARD_Y - 20
    const fishBody = scene.add.ellipse(0, iconY, 80, 44, 0x334466, 0.75)
    fishBody.setStrokeStyle(2, 0x556688)
    const fishTail = scene.add.triangle(
      0, iconY,
      -40, -10, -40, 10, -62, 0,
      0x334466, 0.65,
    )
    // 小眼睛
    const fishEye = scene.add.arc(16, iconY - 8, 4, 0, 360, false, 0x8899aa)

    // 主按钮：重新挑战（绿色，对齐截图）
    const retryBtnY = CARD_Y + CARD_H / 2 - 116
    const retryBg   = scene.add.rectangle(0, retryBtnY, 320, 68, 0x22bb55)
    retryBg.setStrokeStyle(2, 0x66dd88)
    const retryTxt = scene.add.text(0, retryBtnY, '重新挑战', {
      fontSize: '26px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    retryBg.setInteractive({ useHandCursor: true })
    retryBg.on('pointerover', () => retryBg.setFillStyle(0x33dd66))
    retryBg.on('pointerout',  () => retryBg.setFillStyle(0x22bb55))
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

    this.root.add([
      overlay, card, topBar,
      titleTxt, subtitleTxt,
      fishBody, fishTail, fishEye,
      retryBg, retryTxt,
      exitBg, exitTxt,
    ])
    layer.add(this.root)
  }

  show(): void {
    this.root.setVisible(true)
    this.root.setAlpha(0)
    this.root.setScale(0.9)
    this.scene.tweens.add({
      targets: this.root,
      alpha: 1, scaleX: 1, scaleY: 1,
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
