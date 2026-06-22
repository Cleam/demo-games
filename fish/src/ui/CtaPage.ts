/**
 * CtaPage.ts
 * CTA 最终页面（CtaLayer）。
 * 隐藏战斗层/HUD/进化卡/弹窗，展示主角 + 行动按钮。
 * 通过 show() 激活，once 调用。
 */

import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/constants'

export class CtaPage {
  private scene:   Phaser.Scene
  private root:    Phaser.GameObjects.Container
  /** 若有 final_actor Actor，可传入此引用在 CTA 界面继续播放 idle */
  private actorContainer?: Phaser.GameObjects.Container

  constructor(
    scene: Phaser.Scene,
    layer: Phaser.GameObjects.Container,
    /** 点击主按钮时的回调（宿主注入真实跳链，否则只提供缩放反馈） */
    onClickthrough?: () => void,
  ) {
    this.scene = scene
    this.root  = scene.add.container(GAME_WIDTH / 2, 0)
    this.root.setVisible(false)

    const cx = 0  // 相对父容器

    // 全屏背景（深邃蓝色）
    const bg = scene.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x040820)

    // 渐变光晕（程序绘制，营造海底光感）
    const glow = scene.add.graphics()
    glow.fillGradientStyle(0x0022ff, 0x0022ff, 0x000820, 0x000820, 0.25)
    glow.fillRect(cx - GAME_WIDTH / 2, 300, GAME_WIDTH, 600)

    // 顶部标题
    const title = scene.add.text(cx, 200, '你能吞噬多少鱼？', {
      fontSize: '38px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 3, color: '#0033aa', blur: 12, fill: true },
    }).setOrigin(0.5)

    // 角色展示占位区域（Stage 7 替换为真实 final_actor idle 动画）
    const actorPlaceholder = scene.add.container(cx, 640)
    const actorCircle = scene.add.arc(0, 0, 90, 0, 360, false, 0x0033cc, 0.4)
    actorCircle.setStrokeStyle(3, 0x4488ff)
    const actorNote = scene.add.text(0, 0, '🐟', {
      fontSize: '80px',
    }).setOrigin(0.5)
    actorPlaceholder.add([actorCircle, actorNote])
    this.actorContainer = actorPlaceholder

    // 副标题
    const subtitle = scene.add.text(cx, 940, '无需下载  点击即玩', {
      fontSize: '22px',
      color: '#88bbff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      letterSpacing: 2,
    }).setOrigin(0.5)

    // 主按钮
    const btnY  = 1070
    const btnBg = scene.add.rectangle(cx, btnY, 380, 80, 0x2266ff)
    btnBg.setStrokeStyle(3, 0x88ccff)
    const btnTxt = scene.add.text(cx, btnY, '立即体验', {
      fontSize: '30px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 按钮交互
    btnBg.setInteractive({ useHandCursor: true })
    btnBg.on('pointerover',  () => btnBg.setFillStyle(0x4488ff))
    btnBg.on('pointerout',   () => btnBg.setFillStyle(0x2266ff))
    btnBg.on('pointerdown',  () => {
      this.scene.tweens.add({
        targets: [btnBg, btnTxt],
        scaleX: 0.92,
        scaleY: 0.92,
        duration: 80,
        yoyo: true,
        onComplete: () => onClickthrough?.(),
      })
    })

    // 按钮持续脉动动画（引导用户点击）
    this.scene.tweens.add({
      targets: btnBg,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.root.add([bg, glow, title, actorPlaceholder, subtitle, btnBg, btnTxt])
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
