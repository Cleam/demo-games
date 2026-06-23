import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '@/config/constants'
import { type CharacterSlot, getCharacterConfig, getPresentationFrame, getPresentationScale } from '@/config/assetMapping'
import { applyTextureToImage } from '@/utils/DynamicTexture'

const CARD_W = 600
const CARD_H = 700
const CARD_Y = GAME_HEIGHT / 2 - 6

const REWARDS = [
  '神装碎片', '上衣', '头盔', '鞋子', '神器',
  '武器', '护腕', '项链', '头盔', '鞋子',
  '加速券', '灵核石', '宝石币', '水生宝石', '钻石',
  '召唤券', '进化石', '贝壳', '碎片', '宝箱',
]

export class WinModal {
  private scene: Phaser.Scene
  private root: Phaser.GameObjects.Container

  constructor(
    scene: Phaser.Scene,
    layer: Phaser.GameObjects.Container,
    heroSlot: CharacterSlot,
    onClaim: () => void,
  ) {
    this.scene = scene
    this.root = scene.add.container(GAME_WIDTH / 2, 0)
    this.root.setVisible(false)

    const heroCfg = getCharacterConfig(heroSlot)
    const overlay = scene.add.rectangle(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72)

    const glow = scene.add.graphics()
    glow.fillGradientStyle(0x3b1100, 0x3b1100, 0x090d21, 0x090d21, 0.92)
    glow.fillRoundedRect(-CARD_W / 2, CARD_Y - CARD_H / 2, CARD_W, CARD_H, 26)
    glow.lineStyle(4, 0xffbf31, 0.98)
    glow.strokeRoundedRect(-CARD_W / 2, CARD_Y - CARD_H / 2, CARD_W, CARD_H, 26)

    const heroHalo = scene.add.circle(0, CARD_Y - 252, 118, 0xffde78, 0.24)
    heroHalo.setStrokeStyle(4, 0xffe5a8, 0.75)
    const hero = scene.add.image(0, CARD_Y - 245, '__DEFAULT').setVisible(false)
    hero.setScale(getPresentationScale(heroSlot, 'result'))
    applyTextureToImage(scene, hero, getPresentationFrame(heroSlot, 'result'))

    const titleBar = scene.add.rectangle(0, CARD_Y - 138, 360, 66, 0xf3c34a)
    titleBar.setStrokeStyle(3, 0xffe8a8)
    const title = scene.add.text(0, CARD_Y - 138, '恭喜获得', {
      fontSize: '34px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
      stroke: '#915f0a',
      strokeThickness: 8,
    }).setOrigin(0.5)

    const subTitle = scene.add.text(0, CARD_Y - 94, `${heroCfg.displayName} 狩猎成功`, {
      fontSize: '15px',
      color: '#ffd989',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5)

    const rewardItems = this.createRewardGrid(CARD_Y + 52)

    const btnY = CARD_Y + CARD_H / 2 - 66
    const btnBg = scene.add.rectangle(0, btnY, 344, 70, 0xf0cb53)
    btnBg.setStrokeStyle(3, 0xffefbc)
    const btnTxt = scene.add.text(0, btnY, '领取奖励', {
      fontSize: '28px',
      color: '#342100',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnBg.setInteractive({ useHandCursor: true })
    btnBg.on('pointerover', () => btnBg.setFillStyle(0xffd96b))
    btnBg.on('pointerout', () => btnBg.setFillStyle(0xf0cb53))
    btnBg.on('pointerdown', () => {
      btnBg.disableInteractive()
      scene.tweens.add({
        targets: [btnBg, btnTxt],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        yoyo: true,
        onComplete: onClaim,
      })
    })

    this.root.add([overlay, glow, heroHalo, hero, titleBar, title, subTitle, ...rewardItems, btnBg, btnTxt])
    layer.add(this.root)
  }

  show(): void {
    this.root.setVisible(true)
    this.root.setAlpha(0)
    this.root.setScale(0.92)
    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 340,
      ease: 'Back.easeOut',
    })
  }

  hide(): void {
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      duration: 220,
      ease: 'Sine.easeIn',
      onComplete: () => this.root.setVisible(false),
    })
  }

  destroy(): void {
    this.root.destroy(true)
  }

  private createRewardGrid(baseY: number): Phaser.GameObjects.GameObject[] {
    const items: Phaser.GameObjects.GameObject[] = []
    const startX = -220
    const startY = baseY - 136

    for (let i = 0; i < REWARDS.length; i++) {
      const col = i % 5
      const row = Math.floor(i / 5)
      const x = startX + col * 110
      const y = startY + row * 102

      const slot = i % 4 === 0 ? 'final_actor' : i % 3 === 0 ? 'evolution_3' : i % 2 === 0 ? 'evolution_2' : 'evolution_1'
      const box = this.scene.add.rectangle(x, y, 92, 84, 0xffd02e)
      box.setStrokeStyle(3, 0xfff2ac)
      const inner = this.scene.add.rectangle(x, y, 80, 72, 0x6d2f00)
      const icon = this.scene.add.image(x, y - 8, '__DEFAULT').setVisible(false)
      icon.setScale(0.34)
      applyTextureToImage(this.scene, icon, getPresentationFrame(slot, 'portrait'))
      const txt = this.scene.add.text(x, y + 32, REWARDS[i], {
        fontSize: '10px',
        color: '#fff2b6',
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      }).setOrigin(0.5)
      items.push(box, inner, icon, txt)
    }
    return items
  }
}
