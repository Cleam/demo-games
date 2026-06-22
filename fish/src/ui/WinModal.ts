/**
 * WinModal.ts
 * 胜利奖励弹窗（ModalLayer）。
 * showResult 事件触发后显示；点击"领取"按钮执行 onClaim 回调。
 */

import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/constants'

const CARD_W = 580
const CARD_H = 560
const CARD_Y = GAME_HEIGHT / 2 - 40  // 略靠上，避免被底部进化卡遮挡

export class WinModal {
  private scene: Phaser.Scene
  private root:  Phaser.GameObjects.Container

  constructor(
    scene:   Phaser.Scene,
    layer:   Phaser.GameObjects.Container,
    onClaim: () => void,
  ) {
    this.scene = scene
    this.root  = scene.add.container(GAME_WIDTH / 2, 0)
    this.root.setVisible(false)

    // 全屏暗色遮罩
    const overlay = scene.add.rectangle(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.82)

    // 弹窗卡片背景
    const card = scene.add.rectangle(0, CARD_Y, CARD_W, CARD_H, 0x0d1a3a)
    card.setStrokeStyle(2, 0xffd700)

    // 装饰条（顶部）
    const topBar = scene.add.rectangle(0, CARD_Y - CARD_H / 2 + 16, CARD_W, 32, 0xffd700, 0.15)

    // 标题
    const titleTxt = scene.add.text(0, CARD_Y - CARD_H / 2 + 50, '恭喜获得！', {
      fontSize: '32px',
      color: '#ffd700',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 副标题
    const subtitleTxt = scene.add.text(0, CARD_Y - CARD_H / 2 + 92, '进化之路的胜利', {
      fontSize: '16px',
      color: '#88aacc',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5)

    // 奖励格（3 个占位格子）
    const rewardItems = this.createRewardItems(scene, CARD_Y - 20)

    // 领取按钮
    const btnW  = 300
    const btnH  = 66
    const btnY  = CARD_Y + CARD_H / 2 - 62
    const btnBg = scene.add.rectangle(0, btnY, btnW, btnH, 0xffd700)
    btnBg.setStrokeStyle(2, 0xffeebb)
    const btnTxt = scene.add.text(0, btnY, '领  取', {
      fontSize: '26px',
      color: '#1a1000',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 按钮交互
    btnBg.setInteractive({ useHandCursor: true })
    btnBg.on('pointerover',  () => btnBg.setFillStyle(0xffe066))
    btnBg.on('pointerout',   () => btnBg.setFillStyle(0xffd700))
    btnBg.on('pointerdown',  () => {
      btnBg.setInteractive(false)
      scene.tweens.add({
        targets: [btnBg, btnTxt],
        scaleX: 0.93,
        scaleY: 0.93,
        duration: 80,
        yoyo: true,
        onComplete: () => onClaim(),
      })
    })

    this.root.add([overlay, card, topBar, titleTxt, subtitleTxt, ...rewardItems, btnBg, btnTxt])
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

  // ──────────────────────────────────────────────────────────────────

  private createRewardItems(scene: Phaser.Scene, baseY: number): Phaser.GameObjects.GameObject[] {
    const items: Phaser.GameObjects.GameObject[] = []
    const positions = [-150, 0, 150]
    const labels    = ['稀有鱼', '金币 ×1000', '进化加速']

    for (let i = 0; i < 3; i++) {
      const x = positions[i]
      const itemBg = scene.add.rectangle(x, baseY, 140, 140, 0x132040)
      itemBg.setStrokeStyle(1, 0x2255aa)

      // 图标占位（彩色圆形）
      const colors = [0xff8844, 0xffcc44, 0x44aaff]
      const icon   = scene.add.arc(x, baseY - 20, 38, 0, 360, false, colors[i])
      icon.setStrokeStyle(2, 0xffffff, 0.3)

      const txt = scene.add.text(x, baseY + 42, labels[i], {
        fontSize: '13px',
        color: '#aabbdd',
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      }).setOrigin(0.5)

      items.push(itemBg, icon, txt)
    }
    return items
  }
}
