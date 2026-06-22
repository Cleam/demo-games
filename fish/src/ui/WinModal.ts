/**
 * WinModal.ts
 * 胜利奖励弹窗（ModalLayer）。
 * 样式对齐截图 win06：标题"奖励卡"，2行×3列奖励格，金黄色主调。
 */

import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/constants'

const CARD_W = 570
const CARD_H  = 580
const CARD_Y  = GAME_HEIGHT / 2 - 40  // 600

/** 奖励格内容（鱼名 → 对应颜色，缺少图片素材用彩色圆形代替） */
const REWARDS = [
  { name: '食人鱼',   color: 0xff6644 },
  { name: '史前蛮鳄', color: 0xcc8822 },
  { name: '巨型弹弹鱼', color: 0x4488ff },
  { name: '史前巨鳄', color: 0x9944cc },
  { name: '稀有金币', color: 0xffcc00 },
  { name: '进化之源', color: 0x44cc88 },
]

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
    const overlay = scene.add.rectangle(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85)

    // 弹窗卡片
    const card = scene.add.rectangle(0, CARD_Y, CARD_W, CARD_H, 0x0d1a3a)
    card.setStrokeStyle(2, 0xffd700)

    // 顶部金色装饰条
    const topBar = scene.add.rectangle(0, CARD_Y - CARD_H / 2 + 16, CARD_W, 32, 0xffd700, 0.18)

    // 标题 "奖励卡"
    const titleTxt = scene.add.text(0, CARD_Y - CARD_H / 2 + 54, '奖励卡', {
      fontSize: '32px',
      color: '#ffd700',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 副标题
    const subtitleTxt = scene.add.text(0, CARD_Y - CARD_H / 2 + 94, '挑战成功！', {
      fontSize: '15px',
      color: '#88aacc',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5)

    // 2行 × 3列奖励格
    const rewardItems = this.createRewardGrid(scene, CARD_Y - 60)

    // 领取按钮
    const btnY  = CARD_Y + CARD_H / 2 - 62
    const btnBg = scene.add.rectangle(0, btnY, 320, 66, 0xffd700)
    btnBg.setStrokeStyle(2, 0xffeebb)
    const btnTxt = scene.add.text(0, btnY, '领取奖励', {
      fontSize: '26px',
      color: '#1a1000',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnBg.setInteractive({ useHandCursor: true })
    btnBg.on('pointerover',  () => btnBg.setFillStyle(0xffe066))
    btnBg.on('pointerout',   () => btnBg.setFillStyle(0xffd700))
    btnBg.on('pointerdown',  () => {
      btnBg.setInteractive(false)
      scene.tweens.add({
        targets: [btnBg, btnTxt],
        scaleX: 0.93, scaleY: 0.93,
        duration: 80, yoyo: true,
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

  // ──────────────────────────────────────────────────────────────────

  private createRewardGrid(
    scene:  Phaser.Scene,
    baseY:  number,
  ): Phaser.GameObjects.GameObject[] {
    const items: Phaser.GameObjects.GameObject[] = []

    // 3 列 × 2 行，格子 158×74
    const colX  = [-162, 0, 162]
    const rowY  = [baseY - 42, baseY + 44]
    const gW = 154
    const gH  = 72

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const r   = REWARDS[row * 3 + col]
        const cx  = colX[col]
        const cy  = rowY[row]

        // 格子底色（琥珀黄）
        const bg = scene.add.rectangle(cx, cy, gW, gH, 0x5a3800)
        bg.setStrokeStyle(1.5, 0xffdd44)

        // 彩色鱼图标占位圆（缺少真实鱼类图片素材）
        const icon = scene.add.arc(cx, cy - 12, 22, 0, 360, false, r.color)
        icon.setStrokeStyle(1.5, 0xffffff, 0.35)

        // 鱼名
        const txt = scene.add.text(cx, cy + 24, r.name, {
          fontSize: '11px',
          color: '#ffeeaa',
          fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
        }).setOrigin(0.5)

        items.push(bg, icon, txt)
      }
    }
    return items
  }
}
