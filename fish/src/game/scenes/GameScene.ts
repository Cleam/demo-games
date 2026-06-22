import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, LAYER_DEPTH } from '@/config/constants'
import { type GameMode } from '@/config/modeConfig'
import { stateManager, type GameState } from '@/core/StateManager'
import { TimelineRunner, type TimelineEvent } from '@/systems/TimelineRunner'
import { winTimeline } from '@/config/timeline.win'
import { loseTimeline } from '@/config/timeline.lose'
import { type CharacterSlot, PLAYER_SLOTS } from '@/config/assetMapping'
import { Actor } from '@/game/actors/Actor'
import { EvolutionCard } from '@/ui/EvolutionCard'
import { BossHpBar } from '@/ui/BossHpBar'
import { WinModal } from '@/ui/WinModal'
import { CtaPage } from '@/ui/CtaPage'

export class GameScene extends Phaser.Scene {
  // ── 7 层级容器 ──────────────────────────────────────────────────
  backgroundLayer!: Phaser.GameObjects.Container
  battleLayer!:     Phaser.GameObjects.Container
  effectLayer!:     Phaser.GameObjects.Container
  hudLayer!:        Phaser.GameObjects.Container
  evolutionLayer!:  Phaser.GameObjects.Container
  modalLayer!:      Phaser.GameObjects.Container
  ctaLayer!:        Phaser.GameObjects.Container

  // ── 核心系统 ─────────────────────────────────────────────────────
  runner!: TimelineRunner
  private mode!: GameMode

  // ── 角色管理 ─────────────────────────────────────────────────────
  /** slot 名称 → Actor 实例（支持玩家角色与 Boss/敌方角色并存） */
  private actors = new Map<string, Actor>()
  /** 当前显示的玩家角色槽位名（用于进化替换逻辑） */
  private playerSlot?: string
  /** 普通敌鱼群占位容器（进入 Boss 战后移除） */
  private enemyGroup?: Phaser.GameObjects.Container

  // ── UI 组件 ──────────────────────────────────────────────────────
  private evolutionCards: EvolutionCard[] = []
  private bossHpBar?: BossHpBar
  private winModal?: WinModal
  private ctaPage?: CtaPage

  // ── 调试 ─────────────────────────────────────────────────────────
  private debugTxt?: Phaser.GameObjects.Text

  constructor() { super({ key: 'GameScene' }) }

  init(): void {
    this.mode = this.registry.get('mode') as GameMode
    this.actors.clear()
    this.playerSlot = undefined
    stateManager.enter('playing')
  }

  create(): void {
    this.createLayers()
    this.createBackground()
    this.createTopHud()
    this.createEvolutionPanel()
    this.createBattleUi()
    this.setupTimeline()

    this.events.once('shutdown', () => {
      this.runner.stop()
      for (const actor of this.actors.values()) actor.destroy()
      this.actors.clear()
    })
  }

  // ── 层级初始化 ────────────────────────────────────────────────────

  private createLayers(): void {
    this.backgroundLayer = this.add.container(0, 0).setDepth(LAYER_DEPTH.background)
    this.battleLayer     = this.add.container(0, 0).setDepth(LAYER_DEPTH.battle)
    this.effectLayer     = this.add.container(0, 0).setDepth(LAYER_DEPTH.effect)
    this.hudLayer        = this.add.container(0, 0).setDepth(LAYER_DEPTH.hud)
    this.evolutionLayer  = this.add.container(0, 0).setDepth(LAYER_DEPTH.evolution)
    this.modalLayer      = this.add.container(0, 0).setDepth(LAYER_DEPTH.modal)
    this.ctaLayer        = this.add.container(0, 0).setDepth(LAYER_DEPTH.cta)
  }

  // ── 背景 ─────────────────────────────────────────────────────────

  private createBackground(): void {
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg')
    const scale = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height)
    bg.setScale(scale)
    this.backgroundLayer.add(bg)
  }

  // ── 顶部 HUD ─────────────────────────────────────────────────────

  private createTopHud(): void {
    const hudBg = this.add.rectangle(GAME_WIDTH / 2, 44, GAME_WIDTH, 88, 0x000000, 0.60)

    const levelTxt = this.add.text(24, 44, '第 185 关', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5)

    const modeTxt = this.add.text(GAME_WIDTH - 14, 44,
      this.mode === 'win' ? '胜利模式' : '挑战模式', {
        fontSize: '14px',
        color: this.mode === 'win' ? '#ffd700' : '#ff8888',
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      }).setOrigin(1, 0.5)

    // 右下角小型调试文字（状态机当前状态）
    this.debugTxt = this.add.text(GAME_WIDTH - 8, GAME_HEIGHT - 86, '', {
      fontSize: '10px',
      color: '#334455',
      fontFamily: 'monospace',
    }).setOrigin(1, 1).setDepth(201)

    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => this.debugTxt?.setText(`state:${stateManager.state}`),
    })

    this.hudLayer.add([hudBg, levelTxt, modeTxt])
  }

  // ── 底部进化卡面板 ────────────────────────────────────────────────

  private createEvolutionPanel(): void {
    // 底部半透明深色面板
    const panelBg = this.add.rectangle(GAME_WIDTH / 2, 1214, GAME_WIDTH, 132, 0x040818, 0.88)
    const titleTxt = this.add.text(GAME_WIDTH / 2, 1157, '生物进化', {
      fontSize: '16px',
      color: '#8899bb',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      letterSpacing: 3,
    }).setOrigin(0.5)

    this.evolutionLayer.add([panelBg, titleTxt])

    // 4 张进化卡：均分 720px 宽度
    // 4×158 + 3×13 = 671 → 两侧各留 24.5px
    const cardCY = 1222
    const cardCXList = [104, 275, 446, 617]
    for (let i = 0; i < 4; i++) {
      const card = new EvolutionCard(this, cardCXList[i], cardCY, i, this.evolutionLayer)
      this.evolutionCards.push(card)
    }
  }

  // ── 战斗相关 UI ──────────────────────────────────────────────────

  private createBattleUi(): void {
    if (this.mode === 'win') {
      this.bossHpBar = new BossHpBar(this, GAME_WIDTH / 2, 108, this.hudLayer)
      this.winModal  = new WinModal(this, this.modalLayer, () => this.onClaimReward())
    }
    this.ctaPage = new CtaPage(this, this.ctaLayer, () => {
      console.log('[CTA] clickthrough — 宿主注入跳链')
    })
  }

  // ── 时间轴初始化 ─────────────────────────────────────────────────

  private setupTimeline(): void {
    this.runner = new TimelineRunner(this)
    this.runner.load(this.mode === 'win' ? winTimeline : loseTimeline)

    this.runner.on('spawnActor',              e => this.handleSpawnActor(e))
    this.runner.on('spawnEnemyGroup',         e => this.handleSpawnEnemyGroup(e))
    this.runner.on('removeEnemyGroup',        e => this.handleRemoveEnemyGroup(e))
    this.runner.on('setActorState',           e => this.handleSetActorState(e))
    this.runner.on('actorAttack',             e => this.handleActorAttack(e))
    this.runner.on('actorHit',                e => this.handleActorHit(e))
    this.runner.on('actorExit',               e => this.handleActorExit(e))
    this.runner.on('unlockEvolution',         e => this.handleUnlockEvolution(e))
    this.runner.on('updateEvolutionProgress', e => this.handleUpdateEvolutionProgress(e))
    this.runner.on('showBoss',                e => this.handleShowBoss(e))
    this.runner.on('removeBoss',              e => this.handleRemoveBoss(e))
    this.runner.on('updateBossHp',            e => this.handleUpdateBossHp(e))
    this.runner.on('showResult',              e => this.handleShowResult(e))
    this.runner.on('changeState',             e => {
      const state = (e.payload as { state: string }).state
      stateManager.enter(state as GameState)
    })

    this.runner.start()
  }

  // ── 时间轴事件处理 ───────────────────────────────────────────────

  /**
   * 角色生成：若生成的是玩家槽位且当前已有玩家角色，先淡出旧角色。
   * Boss/敌方角色不触发替换逻辑。
   */
  private handleSpawnActor(event: TimelineEvent): void {
    const slot = event.target as CharacterSlot

    if (PLAYER_SLOTS.includes(slot) && this.playerSlot && this.playerSlot !== slot) {
      const prev = this.actors.get(this.playerSlot)
      if (prev) {
        prev.exit()
        this.actors.delete(this.playerSlot)
      }
    }
    if (PLAYER_SLOTS.includes(slot)) this.playerSlot = slot

    const actor = new Actor(this, slot, this.battleLayer)
    actor.spawn()
    this.actors.set(slot, actor)
  }

  /** 生成普通敌鱼群占位（3 个半透明椭圆形） */
  private handleSpawnEnemyGroup(_event: TimelineEvent): void {
    if (this.enemyGroup) return
    const grp = this.add.container(0, 0)
    const positions: [number, number][] = [[545, 575], [625, 645], [565, 725]]
    for (const [x, y] of positions) {
      grp.add(this.add.ellipse(x, y, 58, 36, 0x1a4488, 0.75))
    }
    this.battleLayer.add(grp)
    this.enemyGroup = grp
  }

  /** 移除普通敌鱼群（进入 Boss 战时调用） */
  private handleRemoveEnemyGroup(_event: TimelineEvent): void {
    if (!this.enemyGroup) return
    const grp = this.enemyGroup
    this.tweens.add({
      targets: grp,
      alpha: 0,
      duration: 400,
      ease: 'Sine.easeIn',
      onComplete: () => { grp.destroy(true); this.enemyGroup = undefined },
    })
  }

  /** 设置角色动作（idle / move / attack / die） */
  private handleSetActorState(event: TimelineEvent): void {
    const slot   = event.target!
    const action = (event.payload as { action: string }).action
    const actor  = this.actors.get(slot)
    if (!actor) return

    switch (action) {
      case 'idle':   actor.idle(); break
      case 'attack': actor.attack(); break
      case 'die':    actor.die(); break
      case 'move': {
        const toX = (event.payload as { toX?: number }).toX ?? actor.x
        actor.move(toX, 800)
        break
      }
    }
  }

  private handleActorAttack(event: TimelineEvent): void {
    this.actors.get(event.target!)?.attack()
  }

  private handleActorHit(event: TimelineEvent): void {
    this.actors.get(event.target!)?.hit()
  }

  /** 角色退场：die 动画 → 淡出 → 销毁 */
  private handleActorExit(event: TimelineEvent): void {
    const slot  = event.target!
    const actor = this.actors.get(slot)
    if (!actor) return

    const action = (event.payload as { action?: string }).action
    const cleanup = () => {
      actor.exit(() => { actor.destroy(); this.actors.delete(slot) })
    }
    if (action === 'die') {
      actor.die(cleanup)
    } else {
      cleanup()
    }
  }

  /** 更新进化卡状态（locked / unlocking / unlocked） */
  private handleUnlockEvolution(event: TimelineEvent): void {
    const p    = event.payload as { index: number; state: string }
    const card = this.evolutionCards[p.index]
    card?.setState(p.state as 'locked' | 'unlocking' | 'unlocked')
  }

  /** 更新进化卡经验进度条（0–1） */
  private handleUpdateEvolutionProgress(event: TimelineEvent): void {
    const p    = event.payload as { index: number; progress: number }
    const card = this.evolutionCards[p.index]
    card?.setProgress(p.progress)
  }

  /** 显示 Boss 血条 */
  private handleShowBoss(_event: TimelineEvent): void {
    this.bossHpBar?.show()
  }

  /** 隐藏 Boss 血条并移除 Boss 角色 */
  private handleRemoveBoss(_event: TimelineEvent): void {
    this.bossHpBar?.hide()
    const boss = this.actors.get('boss_win')
    if (boss) {
      boss.exit(() => { boss.destroy(); this.actors.delete('boss_win') })
    }
  }

  /** 更新 Boss 血条百分比 */
  private handleUpdateBossHp(event: TimelineEvent): void {
    const percent = (event.payload as { percent: number }).percent
    this.bossHpBar?.setPercent(percent)
  }

  /** 显示结果弹窗（win_modal / lose_modal） */
  private handleShowResult(event: TimelineEvent): void {
    if (event.target === 'win_modal') {
      this.winModal?.show()
    }
    // lose_modal → Stage 5 实现
  }

  // ── 用户交互 ─────────────────────────────────────────────────────

  /** 点击"领取"后进入 CTA，隐藏战斗层与弹窗 */
  private onClaimReward(): void {
    stateManager.enter('cta')
    this.runner.stop()
    this.winModal?.hide()

    this.battleLayer.setVisible(false)
    this.effectLayer.setVisible(false)
    this.hudLayer.setVisible(false)
    this.evolutionLayer.setVisible(false)

    this.ctaPage?.show()
  }
}
