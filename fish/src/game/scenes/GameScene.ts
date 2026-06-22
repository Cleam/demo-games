import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, LAYER_DEPTH } from '@/config/constants'
import { type GameMode } from '@/config/modeConfig'
import { stateManager, type GameState } from '@/core/StateManager'
import { TimelineRunner, type TimelineEvent } from '@/systems/TimelineRunner'
import { winTimeline } from '@/config/timeline.win'
import { loseTimeline } from '@/config/timeline.lose'
import { type CharacterSlot, PLAYER_SLOTS, slotConfig } from '@/config/assetMapping'
import { Actor } from '@/game/actors/Actor'
import { EvolutionCard } from '@/ui/EvolutionCard'
import { BossHpBar } from '@/ui/BossHpBar'
import { StaminaBar } from '@/ui/StaminaBar'
import { TimerDisplay } from '@/ui/TimerDisplay'
import { WinModal } from '@/ui/WinModal'
import { LoseModal } from '@/ui/LoseModal'
import { CtaPage } from '@/ui/CtaPage'
import { EffectPlayer } from '@/effects/EffectPlayer'
import { getFishId } from '@/config/assetMapping'

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
  /** 处于背景位置的 slot 集合（enemy_lose 初始背景态追踪） */
  private backgroundActors = new Set<string>()

  // ── UI 组件 ──────────────────────────────────────────────────────
  private evolutionCards: EvolutionCard[] = []
  // win mode
  private bossHpBar?: BossHpBar
  private winModal?:  WinModal
  // lose mode
  private staminaBar?:   StaminaBar
  private timerDisplay?: TimerDisplay
  private loseModal?:    LoseModal
  // shared
  private ctaPage?: CtaPage

  // ── 特效 ─────────────────────────────────────────────────────────
  private effectPlayer?: EffectPlayer

  // ── 调试 ─────────────────────────────────────────────────────────
  private debugTxt?: Phaser.GameObjects.Text

  constructor() { super({ key: 'GameScene' }) }

  init(): void {
    this.mode = this.registry.get('mode') as GameMode
    this.actors.clear()
    this.playerSlot = undefined
    this.backgroundActors.clear()
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
      this.runner?.stop()
      this.effectPlayer?.destroyAll()
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
    const bgScale = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height)
    bg.setScale(bgScale)
    this.backgroundLayer.add(bg)

    // sk.png 叠加层（光效/氛围图）
    const skTex = this.textures.get('sk')
    if (skTex.key !== '__MISSING') {
      const sk = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'sk')
      const skScale = Math.max(GAME_WIDTH / sk.width, GAME_HEIGHT / sk.height)
      sk.setScale(skScale)
      sk.setAlpha(0.45)
      this.backgroundLayer.add(sk)
    }
  }

  // ── 顶部 HUD ─────────────────────────────────────────────────────

  private createTopHud(): void {
    // 深蓝紫底色（120px 高，对齐截图横幅风格）
    const hudBg = this.add.rectangle(GAME_WIDTH / 2, 60, GAME_WIDTH, 120, 0x060a1e, 0.92)

    // 顶部紫蓝色装饰线
    const topLine = this.add.rectangle(GAME_WIDTH / 2, 1.5, GAME_WIDTH, 3, 0x6644cc)

    // 游戏标题（仿"海底幽灵"横幅样式）
    const titleTxt = this.add.text(GAME_WIDTH / 2, 34, '≪ 海底幽灵 ≫', {
      fontSize: '26px',
      color: '#c8a0ff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // 关卡文字（居中）
    const levelTxt = this.add.text(GAME_WIDTH / 2, 76, '第 185 天', {
      fontSize: '18px',
      color: '#aabbdd',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5)

    // 模式标签（右侧）
    const modeTxt = this.add.text(GAME_WIDTH - 14, 76,
      this.mode === 'win' ? '胜利模式' : '挑战模式', {
        fontSize: '13px',
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

    this.hudLayer.add([hudBg, topLine, titleTxt, levelTxt, modeTxt])
  }

  // ── 底部进化卡面板 ────────────────────────────────────────────────

  private createEvolutionPanel(): void {
    const panelBg = this.add.rectangle(GAME_WIDTH / 2, 1214, GAME_WIDTH, 132, 0x040818, 0.88)
    const titleTxt = this.add.text(GAME_WIDTH / 2, 1157, '生物进化', {
      fontSize: '16px',
      color: '#8899bb',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      letterSpacing: 3,
    }).setOrigin(0.5)

    this.evolutionLayer.add([panelBg, titleTxt])

    // 4 张进化卡均分 720px 宽度
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
      // y=140：HUD 横幅扩大到 120px 后下移避免重叠
      this.bossHpBar = new BossHpBar(this, GAME_WIDTH / 2, 140, this.hudLayer)
      this.winModal  = new WinModal(this, this.modalLayer, () => this.onClaimReward())
    } else {
      // lose mode：倒计时 y=132，体力条 y=168（均在新 HUD 120px 下方）
      this.timerDisplay = new TimerDisplay(this, GAME_WIDTH / 2, 132, this.hudLayer)
      this.staminaBar   = new StaminaBar(this, GAME_WIDTH / 2, 168, this.hudLayer)
      this.loseModal    = new LoseModal(this, this.modalLayer,
        () => this.onRetry(),
        () => this.onExitChallenge(),
      )
    }
    this.ctaPage = new CtaPage(this, this.ctaLayer, () => {
      console.log('[CTA] clickthrough — 宿主注入跳链')
    })

    // 特效播放器（共用 effectLayer）
    this.effectPlayer = new EffectPlayer(this, this.effectLayer)
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
    this.runner.on('showStamina',             _e => this.handleShowStamina())
    this.runner.on('updateStamina',           e => this.handleUpdateStamina(e))
    this.runner.on('showTimer',               e => this.handleShowTimer(e))
    this.runner.on('updateTimer',             e => this.handleUpdateTimer(e))
    this.runner.on('showResult',              e => this.handleShowResult(e))
    this.runner.on('changeState',             e => {
      const state = (e.payload as { state: string }).state
      stateManager.enter(state as GameState)
    })

    this.runner.start()
  }

  // ── 时间轴事件处理 ───────────────────────────────────────────────

  /**
   * 角色生成。
   * - 玩家槽位替换：新进化出现时淡出旧角色。
   * - background: true → enemy_lose 在背景位置生成（较小、偏右、半透明），
   *   后续 setActorState.move 时从背景过渡到前景。
   */
  private handleSpawnActor(event: TimelineEvent): void {
    const slot       = event.target as CharacterSlot
    const background = (event.payload as { background?: boolean }).background === true

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

    if (background) {
      // 背景态：远景位置（偏右），缩小，半透明；scale 约为前景 0.42 的 45%
      actor.setTransform({ x: 650, y: 730, scale: 0.19, alpha: 0.45 })
      this.backgroundActors.add(slot)
    }

    this.actors.set(slot, actor)
  }

  /** 生成普通敌鱼群占位（3 条程序绘制的彩色小鱼，对齐截图中的粉红/橙色敌鱼） */
  private handleSpawnEnemyGroup(_event: TimelineEvent): void {
    if (this.enemyGroup) return
    const grp = this.add.container(0, 0)
    const fishData: [number, number, number][] = [
      [548, 575, 0xff8899],
      [628, 648, 0xff6644],
      [568, 725, 0xffaacc],
    ]
    for (const [x, y, color] of fishData) {
      // 鱼体（椭圆）
      const body = this.add.ellipse(x, y, 56, 32, color, 0.85)
      // 尾巴（小椭圆，偏右）
      const tail = this.add.ellipse(x + 36, y, 18, 12, color, 0.62)
      // 眼睛（小白圆）
      const eye  = this.add.arc(x - 12, y - 5, 4, 0, 360, false, 0xffffff, 0.90)
      grp.add([body, tail, eye])
    }
    this.battleLayer.add(grp)
    this.enemyGroup = grp
  }

  /** 移除普通敌鱼群（进入 Boss 战 / 最终对抗时调用） */
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

  /**
   * 设置角色动作（idle / move / attack / die）。
   * 若 slot 处于背景态且触发 move，则同步恢复至前景缩放和透明度。
   */
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
        if (this.backgroundActors.has(slot)) {
          // enemy_lose 从背景过渡到前景，同时恢复缩放和透明度
          this.backgroundActors.delete(slot)
          const cfg = slotConfig[slot as CharacterSlot]
          actor.moveToForeground(toX, 1200, cfg.scale)
        } else {
          actor.move(toX, 800)
        }
        break
      }
    }
  }

  private handleActorAttack(event: TimelineEvent): void {
    const slot  = event.target!
    const actor = this.actors.get(slot)
    if (!actor) return
    actor.attack()

    // 攻击特效叠加在角色位置
    if (this.effectPlayer) {
      const fishId = getFishId(slot as CharacterSlot)
      this.effectPlayer.play(fishId, 'eff_atk', actor.x, actor.y)
    }
  }

  private handleActorHit(event: TimelineEvent): void {
    const slot  = event.target!
    const actor = this.actors.get(slot)
    if (!actor) return
    actor.hit()

    // 命中特效 + 屏幕震动
    if (this.effectPlayer) {
      const fishId = getFishId(slot as CharacterSlot)
      this.effectPlayer.play(fishId, 'eff_hit', actor.x, actor.y)
    }
    this.cameras.main.shake(90, 0.006)
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

    // 解锁时在当前玩家角色位置播放 eff_ult 庆典特效
    if (p.state === 'unlocked' && this.effectPlayer && this.playerSlot) {
      const actor = this.actors.get(this.playerSlot)
      if (actor) {
        const fishId = getFishId(this.playerSlot as CharacterSlot)
        this.effectPlayer.play(fishId, 'eff_ult', actor.x, actor.y)
      }
    }
  }

  /** 更新进化卡经验进度条（0–1） */
  private handleUpdateEvolutionProgress(event: TimelineEvent): void {
    const p    = event.payload as { index: number; progress: number }
    const card = this.evolutionCards[p.index]
    card?.setProgress(p.progress)
  }

  // ── Win mode 处理器 ──────────────────────────────────────────────

  private handleShowBoss(_event: TimelineEvent): void {
    this.bossHpBar?.show()
  }

  private handleRemoveBoss(_event: TimelineEvent): void {
    this.bossHpBar?.hide()
    const boss = this.actors.get('boss_win')
    if (boss) {
      boss.exit(() => { boss.destroy(); this.actors.delete('boss_win') })
    }
  }

  private handleUpdateBossHp(event: TimelineEvent): void {
    const percent = (event.payload as { percent: number }).percent
    this.bossHpBar?.setPercent(percent)
  }

  // ── Lose mode 处理器 ─────────────────────────────────────────────

  private handleShowStamina(): void {
    this.staminaBar?.show()
  }

  private handleUpdateStamina(event: TimelineEvent): void {
    const percent = (event.payload as { percent: number }).percent
    this.staminaBar?.setPercent(percent)
  }

  private handleShowTimer(event: TimelineEvent): void {
    const value = (event.payload as { value?: number }).value
    this.timerDisplay?.show(value)
  }

  private handleUpdateTimer(event: TimelineEvent): void {
    const value = (event.payload as { value: number }).value
    this.timerDisplay?.setValue(value)
  }

  // ── 结果弹窗 ────────────────────────────────────────────────────

  private handleShowResult(event: TimelineEvent): void {
    if (event.target === 'win_modal') {
      this.winModal?.show()
    } else if (event.target === 'lose_modal') {
      this.loseModal?.show()
    }
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

  /**
   * 点击"重新挑战"后完整重启场景。
   * scene.restart() 触发 shutdown → init → create，全部 GameObject 由 Phaser 自动清理。
   * init() 中 stateManager.enter('playing') 需要 restarting 状态作为前置，
   * 因此这里先确保状态机进入合法路径再 restart。
   */
  private onRetry(): void {
    this.runner.stop()
    this.effectPlayer?.destroyAll()
    // 确保状态机路径合法：resultLose → restarting，init() 中再 → playing
    if (stateManager.state === 'finalBattle') stateManager.enter('resultLose')
    stateManager.enter('restarting')
    this.scene.restart()
  }

  /** 点击"退出挑战"后进入 CTA，隐藏战斗层与弹窗 */
  private onExitChallenge(): void {
    stateManager.enter('cta')
    this.runner.stop()
    this.loseModal?.hide()

    this.battleLayer.setVisible(false)
    this.effectLayer.setVisible(false)
    this.hudLayer.setVisible(false)
    this.evolutionLayer.setVisible(false)

    this.ctaPage?.show()
  }
}
