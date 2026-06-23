import Phaser from 'phaser'
import { GAME_WIDTH } from '@/config/constants'
import type { NpcWaveId } from '@/config/progression'
import { NPC_COUNTS } from '@/config/progression'
import { ManifestLoader } from '@/utils/ManifestLoader'
import { Actor } from './Actor'

const NPC_WAVE_LAYOUT: Record<NpcWaveId, { visibleWidth: number; gapX: number; gapY: number; mouthGap: number; baseY: number }> = {
  '01': { visibleWidth: 92, gapX: 54, gapY: 50, mouthGap: 150, baseY: 582 },
  '02': { visibleWidth: 108, gapX: 58, gapY: 54, mouthGap: 162, baseY: 586 },
  '03': { visibleWidth: 122, gapX: 62, gapY: 56, mouthGap: 176, baseY: 590 },
  '04': { visibleWidth: 138, gapX: 66, gapY: 60, mouthGap: 190, baseY: 596 },
  '05': { visibleWidth: 496, gapX: 0, gapY: 0, mouthGap: 238, baseY: 644 },
}

export class NpcWaveController {
  private scene: Phaser.Scene
  private layer: Phaser.GameObjects.Container
  private activeNpcs: Actor[] = []

  constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Container) {
    this.scene = scene
    this.layer = layer
  }

  spawnWave(wave: NpcWaveId, heroMouth: { x: number; y: number }): Actor[] {
    this.destroy()
    const frames = ManifestLoader.getNpcFrames(wave)
    const count = NPC_COUNTS[wave]
    const actors: Actor[] = []
    const layout = NPC_WAVE_LAYOUT[wave]
    const frame = frames[0] ?? ''
    const trim = ManifestLoader.getTrimmedFrame(frame)
    const visibleSize = ManifestLoader.getVisibleBoundsSize(frame)
    const scale = visibleSize && visibleSize.width > 0
      ? layout.visibleWidth / visibleSize.width
      : 0.5
    const formationWidth = count === 1 ? layout.visibleWidth : (layout.gapX * 2 + layout.visibleWidth)
    const defaultBaseX = Phaser.Math.Clamp(
      heroMouth.x + layout.mouthGap,
      layout.visibleWidth * 0.6 + 24,
      GAME_WIDTH - formationWidth - 30,
    )
    const baseX = wave === '05' && trim
      ? this.getRightAnchoredSpawnX(trim, scale, heroMouth.x)
      : defaultBaseX
    const baseY = Math.max(layout.baseY, heroMouth.y + 34)

    for (let i = 0; i < count; i++) {
      const row = count === 1 ? 0 : Math.floor(i / 3)
      const col = count === 1 ? 0 : i % 3
      const x = baseX + col * layout.gapX + row * 18
      const y = baseY + row * layout.gapY + (col % 2 === 0 ? 0 : 10)
      const actor = new Actor(this.scene, this.layer, frames, frames[0])
      actor.spawn({
        x,
        y,
        scale,
        flipX: false,
        alpha: 0.96,
      }, true, 12)

      this.scene.tweens.add({
        targets: actor.player.gameObject,
        x: x + 28,
        y: y + (col % 2 === 0 ? -8 : 8),
        duration: 1200 + i * 45,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut',
      })
      actors.push(actor)
    }

    this.activeNpcs = actors
    return actors
  }

  getActiveNpcs(): Actor[] {
    return this.activeNpcs
  }

  destroy(): void {
    for (const npc of this.activeNpcs) npc.destroy()
    this.activeNpcs = []
  }

  private getRightAnchoredSpawnX(
    trim: NonNullable<ReturnType<typeof ManifestLoader.getTrimmedFrame>>,
    scale: number,
    heroMouthX: number,
  ): number {
    const visibleRightExtent = (trim.bounds.x + trim.bounds.width - trim.centerAnchor.x * trim.sourceWidth) * scale
    const visibleLeftExtent = (trim.centerAnchor.x * trim.sourceWidth - trim.bounds.x) * scale
    const desiredX = GAME_WIDTH - 24 - visibleRightExtent
    const minSafeX = heroMouthX + visibleLeftExtent + 140
    return Math.max(desiredX, minSafeX)
  }
}
