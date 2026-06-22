/**
 * CtaPage.ts
 * CTA 最终页面（CtaLayer）。
 * 样式对齐截图 win07：深紫→洋红渐变背景，黄色大标题，大圆形鱼类占位，白色主按钮。
 */

import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/constants'

export class CtaPage {
  private scene: Phaser.Scene
  private root:  Phaser.GameObjects.Container

  constructor(
    scene: Phaser.Scene,
    layer: Phaser.GameObjects.Container,
    onClickthrough?: () => void,
  ) {
    this.scene = scene
    this.root  = scene.add.container(GAME_WIDTH / 2, 0)
    this.root.setVisible(false)

    const cx = 0  // 相对父容器

    // 全屏背景（深色打底，避免渐变覆盖不完整时露底色）
    const bgBase = scene.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d0020)

    // 深紫→洋红渐变（对齐 win07 截图配色）
    const bgGrad = scene.add.graphics()
    bgGrad.fillGradientStyle(0x1a0040, 0x1a0040, 0x880044, 0x880044, 1)
    bgGrad.fillRect(cx - GAME_WIDTH / 2, 0, GAME_WIDTH, GAME_HEIGHT)

    // 顶部标题（黄色大字）
    const title = scene.add.text(cx, 170, '你能吞噬多少鱼了', {
      fontSize: '36px',
      color: '#ffdd00',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 4, color: '#550022', blur: 16, fill: true },
    }).setOrigin(0.5)

    // Boss 名称副标题（白色）
    const bossName = scene.add.text(cx, 230, '史前巨鳄', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 鱼类展示占位区域（大圆，代替缺少的3D鱼模型）
    const fishGlow = scene.add.graphics()
    fishGlow.fillGradientStyle(0x440066, 0x440066, 0x220033, 0x220033, 0.9)
    fishGlow.fillCircle(cx, 560, 130)
    fishGlow.lineStyle(3, 0xcc44aa, 0.65)
    fishGlow.strokeCircle(cx, 560, 132)
    // 外层发光环
    fishGlow.lineStyle(12, 0xaa2288, 0.25)
    fishGlow.strokeCircle(cx, 560, 148)

    // 占位说明文字（暗示此处将展示真实鱼类模型）
    const fishLabel = scene.add.text(cx, 560, '史前巨鳄', {
      fontSize: '22px',
      color: '#ffaadd',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 副标题（游戏口号）
    const slogan = scene.add.text(cx, 740, '无需下载  立即畅玩', {
      fontSize: '20px',
      color: '#ddbbff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      letterSpacing: 2,
    }).setOrigin(0.5)

    // 主按钮（深蓝底 + 白色文字，对齐截图"无需下载 点击即玩"风格）
    const btnY  = 860
    const btnBg = scene.add.rectangle(cx, btnY, 400, 80, 0x112288)
    btnBg.setStrokeStyle(3, 0x6688ff)
    const btnTxt = scene.add.text(cx, btnY, '无需下载  点击即玩', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 按钮下方小字
    const btnNote = scene.add.text(cx, btnY + 54, '立即体验，无需安装', {
      fontSize: '13px',
      color: '#888888',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5)

    // 按钮交互
    btnBg.setInteractive({ useHandCursor: true })
    btnBg.on('pointerover', () => btnBg.setFillStyle(0x2244cc))
    btnBg.on('pointerout',  () => btnBg.setFillStyle(0x112288))
    btnBg.on('pointerdown', () => {
      scene.tweens.add({
        targets: [btnBg, btnTxt],
        scaleX: 0.92, scaleY: 0.92,
        duration: 80, yoyo: true,
        onComplete: () => onClickthrough?.(),
      })
    })

    // 按钮持续脉动
    scene.tweens.add({
      targets: btnBg,
      scaleX: 1.03, scaleY: 1.03,
      duration: 900,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.root.add([bgBase, bgGrad, title, bossName, fishGlow, fishLabel, slogan, btnBg, btnTxt, btnNote])
    layer.add(this.root)
  }

  show(): void {
    this.root.setVisible(true)
    this.root.setAlpha(0)
    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      duration: 500,
      ease: 'Sine.easeOut',
    })
  }

  destroy(): void {
    this.root.destroy(true)
  }
}
