import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '@/config/constants'
import { type CharacterSlot, getCharacterConfig, getPresentationFrame, getPresentationScale } from '@/config/assetMapping'
import { applyTextureToImage } from '@/utils/DynamicTexture'

export class CtaPage {
  private scene: Phaser.Scene
  private root: Phaser.GameObjects.Container

  constructor(
    scene: Phaser.Scene,
    layer: Phaser.GameObjects.Container,
    heroSlot: CharacterSlot,
    onClickthrough?: () => void,
  ) {
    this.scene = scene
    this.root = scene.add.container(GAME_WIDTH / 2, 0)
    this.root.setVisible(false)

    const cfg = getCharacterConfig(heroSlot)
    const bg = scene.add.graphics()
    bg.fillGradientStyle(0x30005f, 0x30005f, 0xe500b9, 0x8a00d7, 1)
    bg.fillRect(-GAME_WIDTH / 2, 0, GAME_WIDTH, GAME_HEIGHT)

    const rails = scene.add.graphics()
    rails.fillStyle(0xffffff, 0.95)
    rails.fillRect(-GAME_WIDTH / 2, 260, GAME_WIDTH, 24)
    rails.fillRect(-GAME_WIDTH / 2, 332, GAME_WIDTH, 18)
    rails.fillStyle(0xffffff, 0.32)
    rails.fillRect(-GAME_WIDTH / 2, 942, GAME_WIDTH, 20)

    const title = scene.add.text(0, 126, '你能吞噬多少鱼了', {
      fontSize: '48px',
      color: '#ffe42f',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
      stroke: '#a14d00',
      strokeThickness: 8,
    }).setOrigin(0.5)

    const subTitle = scene.add.text(0, 212, cfg.displayName, {
      fontSize: '30px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
      stroke: '#7f4dea',
      strokeThickness: 5,
    }).setOrigin(0.5)

    const heroGlow = scene.add.circle(0, 548, 186, 0x5300ac, 0.18)
    heroGlow.setStrokeStyle(8, 0xdc8dff, 0.26)
    const hero = scene.add.image(-12, 552, '__DEFAULT').setVisible(false)
    hero.setScale(getPresentationScale(heroSlot, 'cta'))
    applyTextureToImage(scene, hero, getPresentationFrame(heroSlot, 'cta'))

    const textA = scene.add.text(0, 934, '无需下载', {
      fontSize: '74px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
      stroke: '#5b4fe6',
      strokeThickness: 8,
    }).setOrigin(0.5)
    const textB = scene.add.text(0, 1024, '点击即玩', {
      fontSize: '74px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
      stroke: '#5b4fe6',
      strokeThickness: 8,
    }).setOrigin(0.5)

    const hitArea = scene.add.rectangle(0, 978, 460, 180, 0x000000, 0.001)
    hitArea.setInteractive({ useHandCursor: true })
    hitArea.on('pointerdown', () => {
      scene.tweens.add({
        targets: [textA, textB],
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 90,
        yoyo: true,
        onComplete: () => onClickthrough?.(),
      })
    })

    scene.tweens.add({
      targets: hero,
      y: 536,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.root.add([bg, rails, title, subTitle, heroGlow, hero, textA, textB, hitArea])
    layer.add(this.root)
  }

  show(): void {
    this.root.setVisible(true)
    this.root.setAlpha(0)
    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      duration: 420,
      ease: 'Sine.easeOut',
    })
  }

  destroy(): void {
    this.root.destroy(true)
  }
}
