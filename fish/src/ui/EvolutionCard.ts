import Phaser from 'phaser'
import type { GameMode } from '@/config/modeConfig'
import type { HeroLevel } from '@/config/progression'
import { HERO_LEVEL_INFO } from '@/config/progression'
import { type CharacterSlot, getCharacterConfig, getPresentationFrame, getPresentationScale } from '@/config/assetMapping'
import { applyTextureToImage } from '@/utils/DynamicTexture'
import { ManifestLoader } from '@/utils/ManifestLoader'

export type CardState = 'locked' | 'current' | 'unlocked'

export class EvolutionCard {
  private scene: Phaser.Scene
  private mode: GameMode
  private slot: CharacterSlot
  private level: HeroLevel
  private root: Phaser.GameObjects.Container
  private bg: Phaser.GameObjects.Rectangle
  private portrait: Phaser.GameObjects.Image
  private titleTxt: Phaser.GameObjects.Text
  private subTxt: Phaser.GameObjects.Text
  private actionTxt: Phaser.GameObjects.Text
  private progressBg: Phaser.GameObjects.Rectangle
  private progressFill: Phaser.GameObjects.Rectangle
  private levelTxt: Phaser.GameObjects.Text

  private static readonly PORTRAIT_VISIBLE_WIDTH: Partial<Record<CharacterSlot, number>> = {
    evolution_1: 82,
    evolution_2: 84,
    evolution_3: 88,
    final_actor: 92,
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    slot: CharacterSlot,
    mode: GameMode,
    layer: Phaser.GameObjects.Container,
  ) {
    this.scene = scene
    this.mode = mode
    this.slot = slot
    this.level = getCharacterConfig(slot).level

    const cfg = getCharacterConfig(slot)
    const info = HERO_LEVEL_INFO[this.level]

    this.root = scene.add.container(x, y)
    this.bg = scene.add.rectangle(0, 0, 640, 108, 0xf8f2de, 0.98)
    this.bg.setStrokeStyle(2, 0xd1c8b0)

    const portraitFrame = scene.add.rectangle(-250, 0, 118, 86, 0xffffff)
    portraitFrame.setStrokeStyle(1.5, 0xdad1bb)
    this.portrait = scene.add.image(-250, -4, '__DEFAULT').setVisible(false)
    const portraitUrl = getPresentationFrame(slot, 'portrait')
    const trim = ManifestLoader.getTrimmedFrame(portraitUrl)
    const targetVisibleWidth = EvolutionCard.PORTRAIT_VISIBLE_WIDTH[slot] ?? 84
    if (trim) {
      this.portrait.setOrigin(trim.centerAnchor.x, trim.centerAnchor.y)
      this.portrait.setScale(targetVisibleWidth / trim.bounds.width)
    } else {
      this.portrait.setScale(getPresentationScale(slot, 'portrait') * 1.08)
    }
    applyTextureToImage(scene, this.portrait, portraitUrl)

    this.levelTxt = scene.add.text(-306, -38, `Lv.${info.levelRequired}`, {
      fontSize: '14px',
      color: '#6f675b',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5)

    this.titleTxt = scene.add.text(-172, -18, cfg.cardName, {
      fontSize: '28px',
      color: '#6c5230',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5)

    this.subTxt = scene.add.text(-172, 18, `${cfg.portraitLabel}  ${cfg.powerLabel}`, {
      fontSize: '18px',
      color: '#887864',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0, 0.5)

    this.actionTxt = scene.add.text(228, 0, '', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
      backgroundColor: '#a7a4a0',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
    }).setOrigin(0.5)

    this.progressBg = scene.add.rectangle(52, 36, 290, 8, 0x21345a, 0.92).setOrigin(0, 0.5)
    this.progressFill = scene.add.rectangle(52, 36, 0, 8, 0xeb4e52, 1).setOrigin(0, 0.5)

    this.root.add([
      this.bg,
      portraitFrame,
      this.portrait,
      this.levelTxt,
      this.titleTxt,
      this.subTxt,
      this.actionTxt,
      this.progressBg,
      this.progressFill,
    ])
    layer.add(this.root)
  }

  setState(state: CardState): void {
    if (state === 'locked') {
      this.bg.setFillStyle(0xf8f2de)
      this.bg.setStrokeStyle(2, 0xd1c8b0)
      this.portrait.setTint(0x000000)
      this.actionTxt.setBackgroundColor('#9d9b99')
      this.actionTxt.setText(this.mode === 'lose' ? `${HERO_LEVEL_INFO[this.level].levelRequired}级解锁` : '待解锁')
      this.progressBg.setVisible(this.mode === 'win')
      this.progressFill.setVisible(this.mode === 'win')
      if (this.mode === 'win') this.progressFill.width = 0
      return
    }

    this.portrait.clearTint()
    this.bg.setFillStyle(state === 'current' ? 0xfff7d8 : 0xfffbef)
    this.bg.setStrokeStyle(2, state === 'current' ? 0xffd86a : 0xe1c76f)

    if (this.mode === 'lose') {
      this.actionTxt.setBackgroundColor(state === 'current' ? '#22a655' : '#9d9b99')
      this.actionTxt.setText(state === 'current' ? '当前等级' : '已解锁')
      this.progressBg.setVisible(false)
      this.progressFill.setVisible(false)
    } else {
      this.actionTxt.setBackgroundColor(state === 'current' ? '#d84c48' : '#9d9b99')
      this.actionTxt.setText(state === 'current' ? '已解锁' : '已达成')
      this.progressBg.setVisible(true)
      this.progressFill.setVisible(true)
      this.progressFill.setFillStyle(state === 'current' ? 0x2fca6a : 0x4cbcf6)
      this.progressFill.width = 290
    }
  }

  setProgress(progress: number): void {
    if (!this.progressFill.visible) return
    const width = 290 * Phaser.Math.Clamp(progress, 0, 1)
    this.scene.tweens.add({
      targets: this.progressFill,
      width,
      duration: 220,
      ease: 'Sine.easeOut',
    })
  }

  destroy(): void {
    this.root.destroy(true)
  }
}
