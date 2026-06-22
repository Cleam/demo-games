import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, LAYER_DEPTH } from '@/config/constants'
import { type GameMode } from '@/config/modeConfig'
import { stateManager } from '@/core/StateManager'

export class GameScene extends Phaser.Scene {
  // 各功能层容器，按深度值分层渲染
  backgroundLayer!: Phaser.GameObjects.Container
  battleLayer!: Phaser.GameObjects.Container
  effectLayer!: Phaser.GameObjects.Container
  hudLayer!: Phaser.GameObjects.Container
  evolutionLayer!: Phaser.GameObjects.Container
  modalLayer!: Phaser.GameObjects.Container
  ctaLayer!: Phaser.GameObjects.Container

  private mode!: GameMode

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
  }

  // ── 层级初始化 ──────────────────────────────────────────────────

  private createLayers(): void {
    this.backgroundLayer = this.add.container(0, 0).setDepth(LAYER_DEPTH.background)
    this.battleLayer     = this.add.container(0, 0).setDepth(LAYER_DEPTH.battle)
    this.effectLayer     = this.add.container(0, 0).setDepth(LAYER_DEPTH.effect)
    this.hudLayer        = this.add.container(0, 0).setDepth(LAYER_DEPTH.hud)
    this.evolutionLayer  = this.add.container(0, 0).setDepth(LAYER_DEPTH.evolution)
    this.modalLayer      = this.add.container(0, 0).setDepth(LAYER_DEPTH.modal)
    this.ctaLayer        = this.add.container(0, 0).setDepth(LAYER_DEPTH.cta)
  }

  // ── 背景 ────────────────────────────────────────────────────────

  private createBackground(): void {
    // bg.png 为横向 3328×2048，按"覆盖"策略适配竖屏 720×1280
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg')
    const scale = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height)
    bg.setScale(scale)
    this.backgroundLayer.add(bg)
  }

  // ── 调试信息（Stage 1 临时，后续阶段替换为真实 HUD）────────────

  private createDebugOverlay(): void {
    const cx = GAME_WIDTH / 2
    const debugDepth = 200 // 临时调试层，高于所有业务层

    const modeColor  = this.mode === 'win' ? '#ffd700' : '#ff6b6b'
    const modeLabel  = this.mode === 'win' ? '胜利流程 (mode=win)' : '失败流程 (mode=lose)'

    // 顶部半透明信息条
    this.add.rectangle(cx, 44, GAME_WIDTH, 88, 0x000000, 0.65).setDepth(debugDepth)

    this.add.text(cx, 26, modeLabel, {
      fontSize: '24px',
      color: modeColor,
      fontStyle: 'bold',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5).setDepth(debugDepth)

    const stateText = this.add.text(cx, 60, `状态: ${stateManager.state}`, {
      fontSize: '16px',
      color: '#88bbff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5).setDepth(debugDepth)

    // 每 500ms 刷新状态显示
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => stateText.setText(`状态: ${stateManager.state}`),
    })

    // 底部层级说明
    this.add.text(cx, GAME_HEIGHT - 10,
      'BG(0) › Battle(10) › Effect(20) › HUD(30) › Evolution(40) › Modal(50) › CTA(60)', {
      fontSize: '11px',
      color: '#445566',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(debugDepth)

    // mode 切换提示
    this.add.text(cx, GAME_HEIGHT - 28, '切换: ?mode=win  /  ?mode=lose', {
      fontSize: '12px',
      color: '#667788',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(debugDepth)
  }
}
