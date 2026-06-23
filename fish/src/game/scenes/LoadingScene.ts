import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/constants'
import { ManifestLoader } from '@/utils/ManifestLoader'

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' })
  }

  preload(): void {
    this.setupProgressBar()
    this.load.json('manifest', '/manifest.json')
    this.load.image('bg', '/assets/images/bg.png')
    this.load.image('as1', '/assets/images/as1.png')
    this.load.image('as2', '/assets/images/as2.png')
  }

  private setupProgressBar(): void {
    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2

    this.add.rectangle(cx, cy, 440, 30, 0x1a1a2e)
    const bar = this.add.rectangle(cx - 200, cy, 0, 22, 0x00aaff)
    bar.setOrigin(0, 0.5)

    const label = this.add.text(cx, cy + 40, '加载中...', {
      fontSize: '18px',
      color: '#aaccff',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
    }).setOrigin(0.5)

    this.load.on('progress', (v: number) => {
      bar.width = 400 * v
      label.setText(`加载中 ${Math.floor(v * 100)}%`)
    })
  }

  create(): void {
    // 初始化 ManifestLoader，供 Actor 等模块同步读取帧路径
    ManifestLoader.init(this.cache.json.get('manifest'))
    this.scene.start('GameScene')
  }
}
