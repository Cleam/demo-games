import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, LAYER_DEPTH } from '@/config/constants'
import { type GameMode } from '@/config/modeConfig'
import { CARD_SLOTS, type CharacterSlot } from '@/config/assetMapping'
import { HERO_LEVEL_INFO, HERO_LEVELS, type HeroLevel, NPC_WAVES, type NpcWaveId, getNextHeroLevel } from '@/config/progression'
import { stateManager } from '@/core/StateManager'
import { SuctionEffectPlayer } from '@/effects/SuctionEffectPlayer'
import { Actor } from '@/game/actors/Actor'
import { NpcWaveController } from '@/game/actors/NpcWaveController'
import { ManifestLoader } from '@/utils/ManifestLoader'
import { CtaPage } from '@/ui/CtaPage'
import { EvolutionCard } from '@/ui/EvolutionCard'
import { LoseModal } from '@/ui/LoseModal'
import { StaminaBar } from '@/ui/StaminaBar'
import { TimerDisplay } from '@/ui/TimerDisplay'
import { WinModal } from '@/ui/WinModal'

const HERO_CARD_LEVELS: HeroLevel[] = ['lv30', 'lv60', 'lv90', 'lv120']

interface ScrollItem {
  object: Phaser.GameObjects.GameObject & { x: number }
  speed: number
  wrapX: number
  resetX: number
}

export class GameScene extends Phaser.Scene {
  backgroundLayer!: Phaser.GameObjects.Container
  battleLayer!: Phaser.GameObjects.Container
  effectLayer!: Phaser.GameObjects.Container
  hudLayer!: Phaser.GameObjects.Container
  evolutionLayer!: Phaser.GameObjects.Container
  modalLayer!: Phaser.GameObjects.Container
  ctaLayer!: Phaser.GameObjects.Container

  private mode!: GameMode
  private currentHeroLevel: HeroLevel = 'lv0'
  private currentNpcWaveIndex = 0
  private isUpgrading = false
  private isFinalLoseSequence = false

  private heroActor?: Actor
  private bossActor?: Actor
  private npcController?: NpcWaveController
  private suctionEffect?: SuctionEffectPlayer
  private staminaBar?: StaminaBar
  private timerDisplay?: TimerDisplay
  private loseModal?: LoseModal
  private winModal?: WinModal
  private ctaPage?: CtaPage
  private evolutionCards: EvolutionCard[] = []
  private scrollingObjects: ScrollItem[] = []

  constructor() { super({ key: 'GameScene' }) }

  init(): void {
    this.mode = this.registry.get('mode') as GameMode
    this.currentHeroLevel = 'lv0'
    this.currentNpcWaveIndex = 0
    this.isUpgrading = false
    this.isFinalLoseSequence = false
    stateManager.enter('playing')
  }

  create(): void {
    this.createLayers()
    this.createBackground()
    this.createTopHud()
    this.createEvolutionPanel()
    this.createOverlayUi()
    this.spawnHero('lv0')
    if (this.mode === 'lose') this.spawnLoseBoss()
    this.npcController = new NpcWaveController(this, this.battleLayer)
    this.suctionEffect = new SuctionEffectPlayer(this, this.effectLayer)

    void this.startFlow()

    this.events.once('shutdown', () => {
      this.npcController?.destroy()
      this.heroActor?.destroy()
      this.bossActor?.destroy()
    })
  }

  update(_time: number, delta: number): void {
    for (const item of this.scrollingObjects) {
      item.object.x -= delta * item.speed
      if (item.object.x <= item.wrapX) item.object.x = item.resetX
    }
  }

  private createLayers(): void {
    this.backgroundLayer = this.add.container(0, 0).setDepth(LAYER_DEPTH.background)
    this.battleLayer = this.add.container(0, 0).setDepth(LAYER_DEPTH.battle)
    this.effectLayer = this.add.container(0, 0).setDepth(LAYER_DEPTH.effect)
    this.hudLayer = this.add.container(0, 0).setDepth(LAYER_DEPTH.hud)
    this.evolutionLayer = this.add.container(0, 0).setDepth(LAYER_DEPTH.evolution)
    this.modalLayer = this.add.container(0, 0).setDepth(LAYER_DEPTH.modal)
    this.ctaLayer = this.add.container(0, 0).setDepth(LAYER_DEPTH.cta)
  }

  private createBackground(): void {
    const bgScale = Math.max(GAME_WIDTH / this.textures.get('bg').getSourceImage().width, GAME_HEIGHT / this.textures.get('bg').getSourceImage().height)
    const bgDisplayWidth = this.textures.get('bg').getSourceImage().width * bgScale
    const bg1 = this.add.image(bgDisplayWidth / 2, GAME_HEIGHT / 2, 'bg')
    const bg2 = this.add.image(bgDisplayWidth * 1.5, GAME_HEIGHT / 2, 'bg')
    bg1.setScale(bgScale)
    bg2.setScale(bgScale)
    this.backgroundLayer.add([bg1, bg2])
    this.scrollingObjects.push(
      { object: bg1, speed: 0.024, wrapX: -bgDisplayWidth / 2, resetX: bgDisplayWidth * 1.5 },
      { object: bg2, speed: 0.024, wrapX: -bgDisplayWidth / 2, resetX: bgDisplayWidth * 1.5 },
    )

    const as2 = this.add.image(GAME_WIDTH / 2, 128, 'as2')
    as2.setScale(GAME_WIDTH / as2.width)
    this.hudLayer.add(as2)

    const levelBg = this.add.rectangle(GAME_WIDTH / 2, 112, 188, 44, 0x000000, 0.42)
    const levelTxt = this.add.text(GAME_WIDTH / 2, 112, '第185关', {
      fontSize: '18px',
      color: '#ffd95d',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    this.hudLayer.add([levelBg, levelTxt])

    const reef1 = this.add.rectangle(552, 802, 228, 64, 0xd1f1ff, 0.9)
    const reef2 = this.add.rectangle(112, 852, 152, 48, 0xc0ecff, 0.85)
    const seaweedPositions = [150, 188, 512, 550, 590]
    for (const x of seaweedPositions) {
      const weed = this.add.rectangle(x, 822, 12, 108, 0x57c09f, 0.72)
      this.backgroundLayer.add(weed)
      this.scrollingObjects.push({ object: weed, speed: 0.056, wrapX: -80, resetX: GAME_WIDTH + 80 })
    }

    const bubble1 = this.add.circle(348, 836, 18, 0xffffff, 0.28)
    const bubble2 = this.add.circle(626, 732, 14, 0xffffff, 0.24)
    this.backgroundLayer.add([reef1, reef2, bubble1, bubble2])
    this.scrollingObjects.push(
      { object: reef1, speed: 0.04, wrapX: -180, resetX: GAME_WIDTH + 220 },
      { object: reef2, speed: 0.048, wrapX: -180, resetX: GAME_WIDTH + 220 },
    )

    for (const bubble of [bubble1, bubble2]) {
      this.tweens.add({
        targets: bubble,
        y: bubble.y - 36,
        alpha: 0.08,
        duration: 1900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    const vignette = this.add.graphics()
    vignette.fillGradientStyle(0x042445, 0x042445, 0x071c35, 0x071c35, 0.22)
    vignette.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    this.backgroundLayer.add(vignette)
  }

  private createTopHud(): void {
    const titleTxt = this.add.text(GAME_WIDTH / 2, 50, '海底幽牢', {
      fontSize: '34px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
      stroke: '#1b215f',
      strokeThickness: 8,
    }).setOrigin(0.5)
    this.hudLayer.add(titleTxt)
  }

  private createEvolutionPanel(): void {
    const panel = this.add.image(GAME_WIDTH / 2, 1128, 'as1')
    panel.setScale(GAME_WIDTH / panel.width)
    panel.setCrop(0, 735, 750, 500)

    const legendBadge = this.add.image(98, 984, 'as1')
    legendBadge.setCrop(0, 0, 220, 260)
    legendBadge.setScale(0.54)

    const titleTxt = this.add.text(GAME_WIDTH / 2, 1118, '生物进化', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
      stroke: '#4e61b5',
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.evolutionLayer.add([panel, legendBadge, titleTxt])

    const positions = [882, 988, 1094, 1200]
    CARD_SLOTS.forEach((slot, index) => {
      const card = new EvolutionCard(this, GAME_WIDTH / 2, positions[index], slot, this.mode, this.evolutionLayer)
      this.evolutionCards.push(card)
    })
    this.refreshEvolutionCards(0)
  }

  private createOverlayUi(): void {
    if (this.mode === 'lose') {
      this.timerDisplay = new TimerDisplay(this, 112, 276, this.hudLayer)
      this.staminaBar = new StaminaBar(this, GAME_WIDTH / 2, 154, this.hudLayer)
      this.loseModal = new LoseModal(this, this.modalLayer, 'final_actor', () => this.onRetry(), () => this.onExitChallenge())
    } else {
      this.winModal = new WinModal(this, this.modalLayer, 'final_actor', () => this.onClaimReward())
    }
    this.ctaPage = new CtaPage(this, this.ctaLayer, 'final_actor', () => {
      console.log('[CTA] clickthrough — 宿主注入跳链')
    })
  }

  private spawnHero(level: HeroLevel): void {
    this.heroActor?.destroy()
    const frames = ManifestLoader.getHeroFrames(level)
    const pose = this.getHeroPose(level)
    this.heroActor = new Actor(this, this.battleLayer, frames, frames[0])
    this.heroActor.spawn(pose, true, 15)
    this.currentHeroLevel = level
  }

  private spawnLoseBoss(): void {
    const bossUrl = ManifestLoader.getBossFrame()
    this.bossActor = new Actor(this, this.battleLayer, [bossUrl], bossUrl)
    this.bossActor.spawn(this.getBossPose(), true, 1)
    this.tweens.add({
      targets: this.bossActor.player.gameObject,
      y: this.bossActor.y - 12,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private async startFlow(): Promise<void> {
    await this.delay(500)
    for (const wave of NPC_WAVES) {
      this.currentNpcWaveIndex = NPC_WAVES.indexOf(wave)
      await this.playWave(wave)

      const nextLevel = getNextHeroLevel(this.currentHeroLevel)
      if (wave !== '05' && nextLevel) {
        await this.upgradeHero(nextLevel)
      }
    }

    if (this.mode === 'lose') await this.playLoseEnding()
    else await this.playWinEnding()
  }

  private async playWave(wave: NpcWaveId): Promise<void> {
    const heroMouth = this.heroActor?.getMouthWorldPoint() ?? { x: 300, y: 590 }
    const npcs = this.npcController?.spawnWave(wave, heroMouth) ?? []
    this.refreshEvolutionCards(0.12)
    this.heroActor?.play(false, 16, () => this.heroActor?.play(true, 14))
    this.followBossBehindHero()

    for (const npc of npcs) {
      npc.moveTo(npc.x + 54, npc.y, 1800)
    }

    await this.delay(480)
    const chasePose = this.getHeroChasePose()
    await new Promise<void>((resolve) => this.heroActor?.tweenPose(chasePose, 420, resolve))

    await this.delay(120)
    const mouth = this.heroActor?.getMouthWorldPoint() ?? { x: 250, y: 580 }
    this.suctionEffect?.play(mouth.x, mouth.y, wave === '05' ? 92 : 72, 720)
    await this.consumeWave(npcs, mouth)

    this.npcController?.destroy()
    await new Promise<void>((resolve) => this.heroActor?.tweenPose(this.getHeroPose(this.currentHeroLevel), 260, resolve))
  }

  private async consumeWave(npcs: Actor[], mouth: { x: number; y: number }): Promise<void> {
    await Promise.all(npcs.map((npc, index) => this.consumeNpc(npc, mouth, index * 60)))
  }

  private consumeNpc(npc: Actor, mouth: { x: number; y: number }, delayMs: number): Promise<void> {
    return new Promise((resolve) => {
      const target = npc.player.gameObject
      const startX = target.x
      const startY = target.y
      const startScale = Math.abs(target.scaleX)
      const spiral = { t: 0 }

      this.time.delayedCall(delayMs, () => {
        this.tweens.add({
          targets: spiral,
          t: 1,
          duration: 650,
          ease: 'Sine.easeIn',
          onUpdate: () => {
            const t = spiral.t
            const angle = indexAngle(delayMs) + t * 5.6
            const radius = (1 - t) * (48 + (delayMs / 60) * 3)
            target.x = Phaser.Math.Linear(startX, mouth.x, t) + Math.cos(angle) * radius
            target.y = Phaser.Math.Linear(startY, mouth.y, t) + Math.sin(angle) * radius * 0.55
            target.setScale(startScale * (1 - t * 0.78))
            target.setAlpha(1 - t * 0.92)
          },
          onComplete: () => {
            npc.destroy()
            resolve()
          },
        })
      })
    })
  }

  private async upgradeHero(nextLevel: HeroLevel): Promise<void> {
    this.isUpgrading = true
    const mouth = this.heroActor?.getMouthWorldPoint() ?? { x: 250, y: 580 }
    this.suctionEffect?.playBurst(mouth.x - 32, mouth.y + 8)
    await this.delay(260)

    const prevActor = this.heroActor
    const prevPose = this.getHeroPose(this.currentHeroLevel)
    prevActor?.fadeOut(220)

    const frames = ManifestLoader.getHeroFrames(nextLevel)
    const nextPose = this.getHeroPose(nextLevel)
    this.heroActor = new Actor(this, this.battleLayer, frames, frames[0])
    this.heroActor.spawn({
      ...nextPose,
      x: mouth.x - 58,
      y: mouth.y + 24,
      alpha: 0.1,
      scale: nextPose.scale * 0.86,
    }, true, 15)

    await new Promise<void>((resolve) => this.heroActor?.tweenPose({ ...nextPose, alpha: 1 }, 320, resolve))
    prevActor?.destroy()
    this.currentHeroLevel = nextLevel
    this.refreshEvolutionCards(1)
    this.followBossBehindHero()
    this.isUpgrading = false
    await this.delay(280)
  }

  private async playWinEnding(): Promise<void> {
    stateManager.enter('resultWin')
    await this.delay(650)
    this.winModal?.show()
  }

  private async playLoseEnding(): Promise<void> {
    this.isFinalLoseSequence = true
    stateManager.enter('finalBattle')

    this.timerDisplay?.show(10)
    this.staminaBar?.show()
    this.staminaBar?.setPercent(1)

    const hero = this.heroActor
    const boss = this.bossActor
    if (!hero || !boss) return

    const mouth = hero.getMouthWorldPoint()
    await new Promise<void>((resolve) => boss.tweenPose({ x: hero.x - 274, y: hero.y - 8 }, 900, resolve))

    for (const value of [0.82, 0.58, 0.34, 0.12, 0]) {
      this.staminaBar?.setPercent(value)
      this.timerDisplay?.setValue(10 * value)
      this.suctionEffect?.play(mouth.x - 188, mouth.y - 18, 102, 600)
      hero.flashHit()
      await this.delay(360)
    }

    const bossMouth = boss.getMouthWorldPoint()
    await new Promise<void>((resolve) => {
      const target = hero.player.gameObject
      const startX = target.x
      const startY = target.y
      const startScale = Math.abs(target.scaleX)
      const state = { t: 0 }
      this.tweens.add({
        targets: state,
        t: 1,
        duration: 880,
        ease: 'Sine.easeIn',
        onUpdate: () => {
          const t = state.t
          const angle = Math.PI + t * 6
          const radius = (1 - t) * 66
          target.x = Phaser.Math.Linear(startX, bossMouth.x, t) + Math.cos(angle) * radius
          target.y = Phaser.Math.Linear(startY, bossMouth.y, t) + Math.sin(angle) * radius * 0.45
          target.setScale(startScale * (1 - t * 0.88))
          target.setAlpha(1 - t * 0.95)
        },
        onComplete: () => resolve(),
      })
    })

    hero.destroy()
    this.heroActor = undefined
    stateManager.enter('resultLose')
    await this.delay(300)
    this.loseModal?.show()
  }

  private refreshEvolutionCards(currentProgress: number): void {
    const currentIndex = HERO_LEVELS.indexOf(this.currentHeroLevel)
    this.evolutionCards.forEach((card, index) => {
      const levelIndex = HERO_LEVELS.indexOf(HERO_CARD_LEVELS[index])
      if (currentIndex > levelIndex) {
        card.setState('unlocked')
        card.setProgress(1)
      } else if (currentIndex === levelIndex) {
        card.setState('current')
        card.setProgress(this.mode === 'win' ? currentProgress : 1)
      } else {
        card.setState('locked')
        card.setProgress(0)
      }
    })
  }

  private getHeroPose(level: HeroLevel): { x: number; y: number; scale: number; flipX: boolean } {
    const base = {
      x: 228,
      y: 620,
      scale: 1,
      flipX: false,
    }
    const targetVisibleWidth: Record<HeroLevel, number> = {
      lv0: 236,
      lv30: 300,
      lv60: 382,
      lv90: 500,
      lv120: 620,
    }
    const frame = ManifestLoader.getHeroFrames(level)[0] ?? ''
    return {
      ...base,
      y: level === 'lv0' ? 658 : level === 'lv60' ? 648 : level === 'lv90' ? 666 : level === 'lv120' ? 694 : 640,
      scale: this.scaleForVisibleWidth(frame, targetVisibleWidth[level]),
    }
  }

  private getHeroChasePose(): { x: number; y: number; scale: number } {
    const pose = this.getHeroPose(this.currentHeroLevel)
    return {
      x: pose.x + 74,
      y: pose.y - 10,
      scale: pose.scale * 1.08,
    }
  }

  private getBossPose(): { x: number; y: number; scale: number; flipX: boolean } {
    const bossFrame = ManifestLoader.getBossFrame()
    return {
      x: -228,
      y: 640,
      scale: this.scaleForVisibleWidth(bossFrame, 920),
      flipX: true,
    }
  }

  private followBossBehindHero(): void {
    if (this.mode !== 'lose' || !this.heroActor || !this.bossActor || this.isFinalLoseSequence) return
    this.bossActor.tweenPose({
      x: this.heroActor.x - 492,
      y: this.heroActor.y - 18,
    }, 420)
  }

  private scaleForVisibleWidth(frameUrl: string, visibleWidth: number): number {
    const trim = ManifestLoader.getTrimmedFrame(frameUrl)
    if (!trim || trim.bounds.width === 0) return 0.5
    return visibleWidth / trim.bounds.width
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, () => resolve()))
  }

  private onClaimReward(): void {
    stateManager.enter('cta')
    this.winModal?.hide()
    this.battleLayer.setVisible(false)
    this.effectLayer.setVisible(false)
    this.hudLayer.setVisible(false)
    this.evolutionLayer.setVisible(false)
    this.ctaPage?.show()
  }

  private onRetry(): void {
    stateManager.enter('restarting')
    this.scene.restart()
  }

  private onExitChallenge(): void {
    stateManager.enter('cta')
    this.loseModal?.hide()
    this.battleLayer.setVisible(false)
    this.effectLayer.setVisible(false)
    this.hudLayer.setVisible(false)
    this.evolutionLayer.setVisible(false)
    this.ctaPage?.show()
  }
}

function indexAngle(delayMs: number): number {
  return (delayMs / 60) * 0.7
}
