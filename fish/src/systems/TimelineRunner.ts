import Phaser from 'phaser'

// §9 时间轴事件类型全集
export type TimelineEventType =
  | 'spawnActor'
  | 'spawnEnemyGroup'
  | 'removeEnemyGroup'
  | 'setActorState'
  | 'actorAttack'
  | 'actorHit'
  | 'actorExit'
  | 'showEffect'
  | 'unlockEvolution'
  | 'updateEvolutionProgress'
  | 'showBoss'
  | 'removeBoss'
  | 'updateBossHp'
  | 'showStamina'
  | 'updateStamina'
  | 'showTimer'
  | 'updateTimer'
  | 'showResult'
  | 'showCta'
  | 'playAudio'
  | 'changeState'   // 触发全局状态机跳转

export interface TimelineEvent {
  at: number                            // 触发时间，单位毫秒（从 start() 起算）
  type: TimelineEventType
  target?: string                       // 目标槽位 / UI 元素名称
  payload?: Record<string, unknown>     // 额外参数
}

type EventHandler = (event: TimelineEvent) => void

export class TimelineRunner {
  private scene: Phaser.Scene
  private events: TimelineEvent[] = []
  private handlers = new Map<TimelineEventType, Set<EventHandler>>()
  private pendingTimers: Phaser.Time.TimerEvent[] = []
  private _running = false
  private _elapsed = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  get running(): boolean { return this._running }
  get elapsed(): number  { return this._elapsed }

  /** 加载事件序列（start 前调用，会按 at 排序） */
  load(events: TimelineEvent[]): void {
    this.events = [...events].sort((a, b) => a.at - b.at)
  }

  on(type: TimelineEventType, handler: EventHandler): void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler)
  }

  off(type: TimelineEventType, handler: EventHandler): void {
    this.handlers.get(type)?.delete(handler)
  }

  /**
   * 启动时间轴。
   * 每个事件通过 scene.time.delayedCall 调度，
   * 保证与 Phaser 帧循环同步，不受 setInterval 漂移影响。
   */
  start(): void {
    if (this._running) {
      console.warn('[TimelineRunner] 已在运行，先调用 stop() 再重新启动')
      return
    }
    this._running = true
    this._elapsed = 0

    for (const event of this.events) {
      const timer = this.scene.time.delayedCall(event.at, () => {
        this._elapsed = event.at
        this.dispatch(event)
      })
      this.pendingTimers.push(timer)
    }
  }

  /**
   * 停止时间轴，取消所有尚未执行的定时器。
   * 重试时必须先调用此方法。
   */
  stop(): void {
    for (const timer of this.pendingTimers) {
      this.scene.time.removeEvent(timer)
    }
    this.pendingTimers = []
    this._running = false
  }

  /**
   * 停止并清空已加载的事件列表。
   * handlers 保留（避免重启后重复注册），由外部决定是否重新注册。
   */
  reset(): void {
    this.stop()
    this.events = []
    this._elapsed = 0
  }

  private dispatch(event: TimelineEvent): void {
    const fns = this.handlers.get(event.type)
    if (fns) {
      for (const fn of fns) fn(event)
    }
  }
}
