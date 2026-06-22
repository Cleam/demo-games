/**
 * timeline.win.ts
 * 胜利流程（mode=win）完整时间轴事件序列。
 * 基于 GAME_FLOW.md §10.3，时间单位为毫秒。
 * 所有 at 值均为可调视觉目标，不是硬性业务规则。
 */

import type { TimelineEvent } from '@/systems/TimelineRunner'

export const winTimeline: TimelineEvent[] = [

  // ── 初始化（0s）─────────────────────────────────────────────────
  { at: 0,     type: 'spawnActor',             target: 'starter',     payload: {} },
  { at: 0,     type: 'spawnEnemyGroup',        target: 'enemy_group', payload: { count: 3 } },
  // 4 张进化卡全部初始为 locked
  { at: 0,     type: 'updateEvolutionProgress', target: 'card_0',     payload: { progress: 0, index: 0 } },
  { at: 0,     type: 'updateEvolutionProgress', target: 'card_1',     payload: { progress: 0, index: 1 } },
  { at: 0,     type: 'updateEvolutionProgress', target: 'card_2',     payload: { progress: 0, index: 2 } },
  { at: 0,     type: 'updateEvolutionProgress', target: 'card_3',     payload: { progress: 0, index: 3 } },

  { at: 300,   type: 'setActorState',          target: 'starter',     payload: { action: 'idle' } },
  { at: 600,   type: 'actorAttack',            target: 'starter',     payload: {} },

  // ── 第 1 次进化（3.5s）──────────────────────────────────────────
  { at: 2800,  type: 'updateEvolutionProgress', target: 'card_0',     payload: { progress: 0.95, index: 0 } },
  { at: 3300,  type: 'showEffect',             target: 'starter',     payload: { effect: 'eff_ult' } },
  { at: 3500,  type: 'spawnActor',             target: 'evolution_1', payload: {} },
  { at: 3600,  type: 'unlockEvolution',        target: 'card_0',      payload: { state: 'unlocked', index: 0 } },
  { at: 3800,  type: 'actorAttack',            target: 'evolution_1', payload: {} },

  // ── 第 2 次进化（5.4s）──────────────────────────────────────────
  { at: 5000,  type: 'updateEvolutionProgress', target: 'card_1',     payload: { progress: 0.95, index: 1 } },
  { at: 5200,  type: 'showEffect',             target: 'evolution_1', payload: { effect: 'eff_ult' } },
  { at: 5400,  type: 'spawnActor',             target: 'evolution_2', payload: {} },
  { at: 5400,  type: 'unlockEvolution',        target: 'card_1',      payload: { state: 'unlocked', index: 1 } },
  { at: 5700,  type: 'actorAttack',            target: 'evolution_2', payload: {} },

  // ── 第 3 次进化（7.4s）──────────────────────────────────────────
  { at: 7000,  type: 'updateEvolutionProgress', target: 'card_2',     payload: { progress: 0.95, index: 2 } },
  { at: 7200,  type: 'showEffect',             target: 'evolution_2', payload: { effect: 'eff_ult' } },
  { at: 7400,  type: 'spawnActor',             target: 'evolution_3', payload: {} },
  { at: 7400,  type: 'unlockEvolution',        target: 'card_2',      payload: { state: 'unlocked', index: 2 } },
  { at: 7700,  type: 'actorAttack',            target: 'evolution_3', payload: {} },

  // ── 第 4 次进化 / final_actor 登场（9.4s）──────────────────────
  { at: 9000,  type: 'updateEvolutionProgress', target: 'card_3',     payload: { progress: 0.95, index: 3 } },
  { at: 9200,  type: 'showEffect',             target: 'evolution_3', payload: { effect: 'eff_ult' } },
  { at: 9400,  type: 'spawnActor',             target: 'final_actor', payload: {} },
  { at: 9400,  type: 'unlockEvolution',        target: 'card_3',      payload: { state: 'unlocked', index: 3 } },

  // ── Boss 出场（9.6–9.8s）────────────────────────────────────────
  { at: 9600,  type: 'showBoss',               target: 'boss_win',    payload: {} },
  { at: 9700,  type: 'spawnActor',             target: 'boss_win',    payload: {} },
  { at: 9800,  type: 'changeState',                                    payload: { state: 'finalBattle' } },
  { at: 9800,  type: 'actorAttack',            target: 'final_actor', payload: {} },

  // ── Boss 受击 & 血条分段下降（10.0–14.2s）──────────────────────
  { at: 10000, type: 'actorHit',               target: 'boss_win',    payload: {} },
  { at: 10000, type: 'updateBossHp',           target: 'boss_win',    payload: { percent: 0.82 } },
  { at: 11000, type: 'actorHit',               target: 'boss_win',    payload: {} },
  { at: 11000, type: 'updateBossHp',           target: 'boss_win',    payload: { percent: 0.62 } },
  { at: 12000, type: 'actorHit',               target: 'boss_win',    payload: {} },
  { at: 12000, type: 'updateBossHp',           target: 'boss_win',    payload: { percent: 0.42 } },
  { at: 13000, type: 'actorHit',               target: 'boss_win',    payload: {} },
  { at: 13000, type: 'updateBossHp',           target: 'boss_win',    payload: { percent: 0.20 } },
  { at: 14000, type: 'actorHit',               target: 'boss_win',    payload: {} },
  { at: 14000, type: 'updateBossHp',           target: 'boss_win',    payload: { percent: 0.05 } },
  { at: 14200, type: 'updateBossHp',           target: 'boss_win',    payload: { percent: 0.0 } },

  // ── Boss 死亡（14.3–14.5s）──────────────────────────────────────
  { at: 14300, type: 'actorExit',              target: 'boss_win',    payload: { action: 'die' } },
  { at: 14500, type: 'removeBoss',             target: 'boss_win',    payload: {} },

  // ── 胜利结算（15.0–15.3s）──────────────────────────────────────
  { at: 15000, type: 'showResult',             target: 'win_modal',   payload: {} },
  { at: 15300, type: 'changeState',                                    payload: { state: 'resultWin' } },
]
