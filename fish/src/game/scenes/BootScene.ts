import Phaser from 'phaser'
import { detectMode } from '@/config/modeConfig'
import { stateManager } from '@/core/StateManager'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  init(): void {
    // 读取 URL mode 参数，写入 Phaser registry 供各 Scene 共享
    this.registry.set('mode', detectMode())
    stateManager.enter('loading')
  }

  create(): void {
    this.scene.start('LoadingScene')
  }
}
