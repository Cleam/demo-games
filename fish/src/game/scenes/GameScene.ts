import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, LAYER_DEPTH } from '@/config/constants'
import { type GameMode } from '@/config/modeConfig'
import { stateManager, type GameState } from '@/core/StateManager'
import { TimelineRunner, type TimelineEventType } from '@/systems/TimelineRunner'
import { winTimeline } from '@/config/timeline.win'
import { loseTimeline } from '@/config/timeline.lose'

/** 所有需要注册调试日志的事件类型 */
const ALL_EVENT_TYPES: TimelineEventType[] = [
  'spawnActor', 'spawnEnemyGroup', 'removeEnemyGroup', 'setActorState',
  'actorAttack', 'actorHit', 'actorExit', 'showEffect',
  'unlockEvolution', 'updateEvolutionProgress', 'showBoss', 'removeBoss',
  'updateBossHp', 'showStamina', 'updateStamina', 'showTimer', 'updateTimer',
  'showResult', 'showCta', 'playAudio', 'changeState',
]

export class GameScene extends Phaser.Scene {
  // ── 层级容器 ─────────────────────────────────────────────────────
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
  private debugEventText?: Phaser.GameObjects.Text
  private debugElapsedText?: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'GameScene' })
  }

  init(): void {
    this.mode = this.registry.get('mode') as GameMode
    stateManager.enter('playing')
  }

  create(): void {
    this.createLayers()
    this.createBackground()
    this.createDebugOverlay()
    this.setupTimeline()

    // 场景销毁时（scene.restart / scene.stop）自动停止时间轴
    this.events.once('shutdown', () => this.runner.stop())
  }

  // ── 私有：层级初始化 ──────────────────────────────────────────────

  private createLayers(): void {
    this.backgroundLayer = this.add.container(0, 0).setDepth(LAYER_DEPTH.background)
    this.battleLayer     = this.add.container(0, 0).setDepth(LAYER_DEPTH.battle)
    this.effectLayer     = this.add.container(0, 0).setDepth(LAYER_DEPTH.effect)
    this.hudLayer        = this.add.container(0, 0).setDepth(LAYER_DEPTH.hud)
    this.evolutionLayer  = this.add.container(0, 0).setDepth(LAYER_DEPTH.evolution)
    this.modalLayer      = this.add.container(0, 0).setDepth(LAYER_DEPTH.modal)
    this.ctaLayer        = this.add.container(0, 0).setDepth(LAYER_DEPTH.cta)
  }

  // ── 私有：背景 ────────────────────────────────────────────────────

  private createBackground(): void {
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg')
    // bg.png 3328×2048 横向，按"覆盖"策略适配竖屏 720×1280
    const scale = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height)
    bg.setScale(scale)
    this.backgroundLayer.add(bg)
  }

  // ── 私有：调试面板（Stage 1–2 临时，Stage 7 移除）────────────────

  private createDebugOverlay(): void {
    const cx = GAME_WIDTH / 2
    const depth = 200

    const modeColor = this.mode === 'win' ? '#ffd700' : '#ff6b6b'
    const modeLabel = this.mode === 'win' ? '胜利流程 (mode=win)' : '失败流程 (mode=lose)'

    // 顶部半透明信息栏
    this.add.rectangle(cx, 55, GAME_WIDTH, 110, 0x000000, 0.70).setDepth(depth)

    this.add.text(cx, 22, modeLabel, {
      fontSize: '22px',
      color: modeColor,
      fontStyle: 'bold',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5).setDepth(depth)

    const stateText = this.add.text(cx, 50, `状态: ${stateManager.state}`, {
      fontSize: '15px',
      color: '#88bbff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5).setDepth(depth)

    // 时间轴最新事件显示
    this.debugEventText = this.add.text(cx, 74, '时间轴: 等待启动...', {
      fontSize: '13px',
      color: '#99ffcc',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(depth)

    // 时间轴经过时间
    this.debugElapsedText = this.add.text(cx, 94, 'elapsed: 0ms', {
      fontSize: '12px',
      color: '#778899',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(depth)

    // 每 300ms 刷新状态与耗时
    this.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        stateText.setText(`状态: ${stateManager.state}`)
        if (this.runner?.running) {
          this.debugElapsedText?.setText(`elapsed: ${this.runner.elapsed}ms`)
        }
      },
    })

    // 底部层级说明
    this.add.text(cx, GAME_HEIGHT - 10,
      'BG(0) › Battle(10) › Effect(20) › HUD(30) › Evolution(40) › Modal(50) › CTA(60)', {
      fontSize: '10px',
      color: '#334455',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(depth)

    this.add.text(cx, GAME_HEIGHT - 22, '切换: ?mode=win  /  ?mode=lose', {
      fontSize: '11px',
      color: '#556677',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(depth)
  }

  // ── 私有：时间轴初始化与调试处理器 ───────────────────────────────

  private setupTimeline(): void {
    this.runner = new TimelineRunner(this)
    this.runner.load(this.mode === 'win' ? winTimeline : loseTimeline)

    // Stage 2 调试：所有事件均输出到 console + 调试面板
    for (const type of ALL_EVENT_TYPES) {
      this.runner.on(type, (event) => {
        const tgt = event.target ? ` → ${event.target}` : ''
        console.log(`[TL ${this.mode}] ${event.at}ms  ${event.type}${tgt}`, event.payload ?? '')
        this.debugEventText?.setText(`${event.at}ms ${event.type}${tgt}`)
      })
    }

    // 状态转换事件：驱动全局状态机
    this.runner.on('changeState', (event) => {
      const nextState = (event.payload as { state: string }).state
      stateManager.enter(nextState as GameState)
    })

    this.runner.start()
  }
}
