/**
 * timeline.lose.ts
 * 失败流程（mode=lose）完整时间轴事件序列。
 * 基于 GAME_FLOW.md §11.3，时间单位为毫秒。
 */

import type { TimelineEvent } from '@/systems/TimelineRunner'

export const loseTimeline: TimelineEvent[] = [

  // ── 初始化（0s）─────────────────────────────────────────────────
  { at: 0,     type: 'spawnActor',             target: 'starter',     payload: {} },
  { at: 0,     type: 'spawnEnemyGroup',        target: 'enemy_group', payload: { count: 3 } },
  // enemy_lose 作为背景角色在左侧弱化存在（background: true 表示初始在背景位置）
  { at: 0,     type: 'spawnActor',             target: 'enemy_lose',  payload: { background: true } },
  // 失败流程进化卡初始显示解锁等级条件（不是 locked 剪影）
  { at: 0,     type: 'unlockEvolution',        target: 'card_0',      payload: { state: 'locked', index: 0, levelRequired: 30 } },
  { at: 0,     type: 'unlockEvolution',        target: 'card_1',      payload: { state: 'locked', index: 1, levelRequired: 60 } },
  { at: 0,     type: 'unlockEvolution',        target: 'card_2',      payload: { state: 'locked', index: 2, levelRequired: 90 } },
  { at: 0,     type: 'unlockEvolution',        target: 'card_3',      payload: { state: 'locked', index: 3, levelRequired: 120 } },

  { at: 500,   type: 'actorAttack',            target: 'starter',     payload: {} },
  { at: 1400,  type: 'actorAttack',            target: 'starter',     payload: {} },
  { at: 2300,  type: 'actorAttack',            target: 'starter',     payload: {} },

  // ── 第 1 次进化（3.2s）──────────────────────────────────────────
  { at: 3200,  type: 'spawnActor',             target: 'evolution_1', payload: {} },
  { at: 3200,  type: 'unlockEvolution',        target: 'card_0',      payload: { state: 'unlocked', index: 0 } },
  { at: 3800,  type: 'actorAttack',            target: 'evolution_1', payload: {} },
  { at: 4600,  type: 'actorAttack',            target: 'evolution_1', payload: {} },

  // ── 第 2 次进化（5.2s）──────────────────────────────────────────
  { at: 5200,  type: 'spawnActor',             target: 'evolution_2', payload: {} },
  { at: 5200,  type: 'unlockEvolution',        target: 'card_1',      payload: { state: 'unlocked', index: 1 } },
  { at: 5800,  type: 'actorAttack',            target: 'evolution_2', payload: {} },
  { at: 6600,  type: 'actorAttack',            target: 'evolution_2', payload: {} },

  // ── 第 3 次进化（7.4s）──────────────────────────────────────────
  { at: 7400,  type: 'spawnActor',             target: 'evolution_3', payload: {} },
  { at: 7400,  type: 'unlockEvolution',        target: 'card_2',      payload: { state: 'unlocked', index: 2 } },
  { at: 8000,  type: 'actorAttack',            target: 'evolution_3', payload: {} },
  { at: 8780,  type: 'actorAttack',            target: 'evolution_3', payload: {} },

  // ── 第 4 次进化 / final_actor 登场（9.4s）──────────────────────
  { at: 9400,  type: 'spawnActor',             target: 'final_actor', payload: {} },
  { at: 9400,  type: 'unlockEvolution',        target: 'card_3',      payload: { state: 'unlocked', index: 3 } },
  { at: 9500,  type: 'removeEnemyGroup',       target: 'enemy_group', payload: {} },

  // ── 最终对抗准备（9.6–9.8s）─────────────────────────────────────
  { at: 9600,  type: 'showStamina',            target: 'stamina',     payload: {} },
  { at: 9600,  type: 'showTimer',              target: 'timer',       payload: { value: 10 } },
  // enemy_lose 从左侧背景位移到主战斗位置
  { at: 9700,  type: 'setActorState',          target: 'enemy_lose',  payload: { action: 'move', toX: 112, toY: 542, duration: 1100 } },
  { at: 9800,  type: 'changeState',                                    payload: { state: 'finalBattle' } },
  { at: 10000, type: 'actorAttack',            target: 'enemy_lose',  payload: {} },
  { at: 10800, type: 'actorAttack',            target: 'enemy_lose',  payload: {} },
  { at: 11800, type: 'actorAttack',            target: 'enemy_lose',  payload: {} },
  { at: 12800, type: 'actorAttack',            target: 'enemy_lose',  payload: {} },
  { at: 13800, type: 'actorAttack',            target: 'enemy_lose',  payload: {} },

  // ── 体力条 & 吞噬时间持续下降（10.0–14.4s）──────────────────────
  { at: 10000, type: 'updateStamina',          target: 'stamina',     payload: { percent: 0.85 } },
  { at: 10000, type: 'updateTimer',            target: 'timer',       payload: { value: 9.5 } },

  { at: 11000, type: 'actorHit',               target: 'final_actor', payload: {} },
  { at: 11000, type: 'updateStamina',          target: 'stamina',     payload: { percent: 0.65 } },
  { at: 11000, type: 'updateTimer',            target: 'timer',       payload: { value: 8.5 } },

  { at: 12000, type: 'actorHit',               target: 'final_actor', payload: {} },
  { at: 12000, type: 'updateStamina',          target: 'stamina',     payload: { percent: 0.45 } },
  { at: 12000, type: 'updateTimer',            target: 'timer',       payload: { value: 7.8 } },

  { at: 13000, type: 'actorHit',               target: 'final_actor', payload: {} },
  { at: 13000, type: 'updateStamina',          target: 'stamina',     payload: { percent: 0.25 } },
  { at: 13000, type: 'updateTimer',            target: 'timer',       payload: { value: 7.0 } },

  { at: 14000, type: 'actorHit',               target: 'final_actor', payload: {} },
  { at: 14000, type: 'updateStamina',          target: 'stamina',     payload: { percent: 0.08 } },
  { at: 14000, type: 'updateTimer',            target: 'timer',       payload: { value: 6.2 } },

  // ── 失败（14.5–15.3s）──────────────────────────────────────────
  { at: 14500, type: 'actorExit',              target: 'final_actor', payload: { action: 'die' } },
  { at: 14700, type: 'updateStamina',          target: 'stamina',     payload: { percent: 0.0 } },
  { at: 15000, type: 'showResult',             target: 'lose_modal',  payload: {} },
  { at: 15300, type: 'changeState',                                    payload: { state: 'resultLose' } },
]
