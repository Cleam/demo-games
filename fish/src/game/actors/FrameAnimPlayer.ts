/**
 * FrameAnimPlayer.ts
 * 通用 PNG 帧序列播放器。
 *
 * 设计要点：
 * - 帧纹理按需通过原生 Image 元素动态加载，不依赖 Phaser Loader
 * - 使用代次计数（playGen）保证中断安全：随时切换动作不残留旧帧事件
 * - 支持 loop（idle/move）和 once（atk/die）两种模式
 * - 暴露 gameObject 供 Actor 移入 Container 并设置位置/缩放
 */

import Phaser from 'phaser'

/** PNG URL 转 Phaser 纹理 key：取文件名去掉 .png 后缀 */
function urlToTextureKey(url: string): string {
  const filename = url.split('/').pop() ?? url
  return filename.endsWith('.png') ? filename.slice(0, -4) : filename
}

export interface PlayOptions {
  frameRate: number
  loop: boolean
  onComplete?: () => void
}

export class FrameAnimPlayer {
  private scene:      Phaser.Scene
  readonly gameObject: Phaser.GameObjects.Image

  private frameTimer: Phaser.Time.TimerEvent | null = null
  /** 每次调用 play() 自增，异步加载回调用此值判断是否已被中断 */
  private playGen = 0

  constructor(scene: Phaser.Scene) {
    this.scene      = scene
    this.gameObject = scene.add.image(0, 0, '__DEFAULT')
    this.gameObject.setVisible(false)
  }

  /**
   * 播放帧序列动画。
   * 如纹理尚未加载则先动态拉取再开始播放；多次调用自动中断上一次。
   */
  play(urls: string[], options: PlayOptions): void {
    const gen = ++this.playGen
    this.stopFrameTimer()

    if (urls.length === 0) return

    // 过滤出尚未缓存的帧
    const unloaded = urls.filter(url => !this.scene.textures.exists(urlToTextureKey(url)))

    if (unloaded.length === 0) {
      this.startAnim(urls, options, gen)
      return
    }

    // 通过原生 Image 元素并发加载所有缺失帧，全部就绪后启动动画
    let settled = 0
    for (const url of unloaded) {
      const key = urlToTextureKey(url)
      const img = new Image()
      const onSettled = () => {
        settled++
        if (settled === unloaded.length && this.playGen === gen) {
          this.startAnim(urls, options, gen)
        }
      }
      img.onload = () => {
        // 避免重复添加（并发 play() 可能导致同一 key 被加载两次）
        if (!this.scene.textures.exists(key)) {
          this.scene.textures.addImage(key, img)
        }
        onSettled()
      }
      img.onerror = () => {
        console.error(`[FrameAnimPlayer] 加载失败: ${url}`)
        onSettled()
      }
      img.src = url
    }
  }

  /** 立即停止播放，隐藏图像 */
  stop(): void {
    this.playGen++  // 使任何挂起的加载回调失效
    this.stopFrameTimer()
    this.gameObject.setVisible(false)
  }

  destroy(): void {
    this.stop()
    if (this.gameObject.scene) {
      this.gameObject.destroy()
    }
  }

  // ──────────────────────────────────────────────────────────────────

  private startAnim(urls: string[], options: PlayOptions, gen: number): void {
    if (this.playGen !== gen) return

    const keys  = urls.map(urlToTextureKey)
    const total = keys.length

    // 显示第 0 帧
    const firstKey = keys.find(k => this.scene.textures.exists(k))
    if (!firstKey) return
    this.gameObject.setTexture(firstKey)
    this.gameObject.setVisible(true)

    let ticks = 0
    const delay = 1000 / options.frameRate

    this.frameTimer = this.scene.time.addEvent({
      delay,
      loop: true,
      callback: () => {
        if (this.playGen !== gen) return  // 已被新的 play() 中断

        ticks++
        const idx = ticks % total
        const key = keys[idx]
        if (this.scene.textures.exists(key)) {
          this.gameObject.setTexture(key)
        }

        // once 模式：播完最后一帧后停止
        if (!options.loop && ticks >= total - 1) {
          this.stopFrameTimer()
          options.onComplete?.()
        }
      },
    })
  }

  private stopFrameTimer(): void {
    if (this.frameTimer) {
      this.scene.time.removeEvent(this.frameTimer)
      this.frameTimer = null
    }
  }
}
