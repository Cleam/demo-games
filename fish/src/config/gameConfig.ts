import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/constants'
import { BootScene } from '@/game/scenes/BootScene'
import { LoadingScene } from '@/game/scenes/LoadingScene'
import { GameScene } from '@/game/scenes/GameScene'

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a1628',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [BootScene, LoadingScene, GameScene],
  render: {
    antialias: false,
    roundPixels: true,
  },
}
