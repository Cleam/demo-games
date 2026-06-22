# PROJECT_DISCOVERY.md

## 1. 项目现状

本文件记录 Phase 0 资源盘点与项目发现阶段的结论。

### 1.1 目录快照

```
fish/
├── AGENTS.md              # AI 协作指引
├── GAME_FLOW.md           # 交互、流程、状态机唯一事实来源
├── VIDEO_ANALYSIS.md      # 两个参考视频逐帧分析
├── assets/
│   ├── v1.mp4             # 胜利流程视觉参考（约 3.95 MB）
│   ├── v2.mp4             # 失败流程视觉参考（约 3.54 MB）
│   └── images/            # 实际美术资源，~1,993 PNG 文件
│       ├── bg.png         # 战斗背景（3328×2048，横向）
│       ├── sk.png         # 次级背景纹理（2560×1440，横向）
│       ├── fish_11002/
│       ├── fish_11003/
│       ├── fish_13201/
│       ├── fish_13203/
│       ├── fish_14104/
│       ├── fish_15101/
│       ├── fish_15102/
│       └── skin_fish_151011/
└── docs/                  # Phase 0 产出（本目录）
```

**尚不存在**：`package.json`、`vite.config.*`、`tsconfig.json`、任何源代码目录（`src/`）或构建产物。

---

## 2. 技术选型决策

### 2.1 选用：Vite + TypeScript + Phaser 3

理由：

| 因素 | 说明 |
|------|------|
| 项目为绿地工程 | 无现有 Cocos Creator 或其他引擎工程需要兼容 |
| Phaser 3 帧序列支持 | 内置 `Phaser.Animations.AnimationManager`，天然支持 PNG 帧序列按名称模板加载 |
| Vite 开发体验 | HMR、原生 ESM、构建速度快；手机调试通过局域网 IP 直连 |
| TypeScript | 配合配置驱动时间轴、状态机，类型约束降低运行期错误 |
| 720×1280 竖屏 | Phaser `ScaleManager` 支持 `FIT` / `ENVELOP` 模式，适配常见手机尺寸 |
| 资源清单生成 | Vite 构建钩子 + Node 脚本可在构建时扫描 assets/images，生成 manifest.json |

### 2.2 不采用的方案

- **Cocos Creator**：无现有工程，不引入新引擎避免增加复杂度。
- **纯 Canvas + 自研**：帧动画、场景管理、缩放适配均需自实现，维护成本高。
- **直接嵌入 mp4**：AGENTS.md 明确禁止将参考视频作为试玩内容播放。

---

## 3. 两条流程架构概述

### 3.1 共用核心（两个 mode 必须复用）

```
┌─────────────────────────────────────────────────────┐
│                     Core Systems                    │
│  StateManager    TimelineRunner    AssetManifest    │
│  ActorSystem     FrameAnimPlayer   EventBus         │
│  EvolutionCards  HudLayer          EffectLayer      │
└─────────────────────────────────────────────────────┘
         │                          │
    win timeline              lose timeline
    (timeline.win.ts)        (timeline.lose.ts)
```

### 3.2 流程差异点

| 维度 | mode=win | mode=lose |
|------|----------|-----------|
| 最终对手 | boss_win（鱼王）| enemy_lose（灰色巨鳄）|
| 最终战斗 UI | Boss 血条 | 体力条 + 吞噬时间 |
| 结算弹窗 | 奖励弹窗 → CTA | 失败弹窗 → 重试/CTA |
| 重试逻辑 | 无 | 有（完整清理并重播）|
| 进化卡初始状态 | locked（剪影）| 显示解锁等级文案 |
| 总时长 | ~18.8s | ~17.9s |

### 3.3 全局状态机

```
BOOT → LOADING → PLAYING → FINAL_BATTLE → RESULT_WIN  → CTA
                                        → RESULT_LOSE → RESTARTING → PLAYING
```

---

## 4. 关键约束提取（来自 GAME_FLOW.md）

### 必须遵守

- 两个 mode 共用核心系统，不允许复制两套业务逻辑。
- 所有流程事件由时间轴驱动，禁止在 UI/角色对象内散落 `setTimeout`。
- 原始 `assets/images` 不允许修改、删除或覆盖。
- 不允许手写海量逐帧资源路径；必须脚本扫描生成 manifest。
- 重试必须完整清理所有 Actor、特效、定时器、UI 状态、事件监听。
- 不直接播放参考视频作为试玩内容。

### 配置化要求

以下内容必须在配置文件中定义，不应散落在业务代码：

- 角色槽位与 fish ID 映射（`assetMapping`）
- 角色坐标、缩放、朝向、帧率
- 时间轴事件序列
- Boss 血条 / 体力条 / 吞噬时间节点
- CTA 文案与 clickthrough 方法

---

## 5. 推荐工程目录结构

```
fish/
├── docs/                      # 文档（Phase 0 产出）
├── scripts/
│   └── gen-manifest.js        # Node 脚本：扫描 assets/images → 生成 manifest.json
├── public/
│   └── manifest.json          # 构建时自动生成，不手写
├── src/
│   ├── main.ts                # Phaser.Game 入口，读取 ?mode 参数
│   ├── config/
│   │   ├── assetMapping.ts    # 槽位 → fish ID 映射
│   │   ├── timeline.win.ts    # 胜利流程时间轴事件配置
│   │   └── timeline.lose.ts   # 失败流程时间轴事件配置
│   ├── systems/
│   │   ├── StateManager.ts    # 全局状态机
│   │   └── TimelineRunner.ts  # 时间轴事件调度器
│   ├── actors/
│   │   ├── Actor.ts           # 角色基类：spawn/idle/move/attack/hit/die/exit
│   │   └── FrameAnimPlayer.ts # 帧动画播放器，支持循环/单次/回调
│   ├── scenes/
│   │   ├── BootScene.ts       # 读取 URL 参数，跳转 LoadingScene
│   │   ├── LoadingScene.ts    # 加载当前 mode 必需资源
│   │   └── GameScene.ts       # 主战斗场景，持有所有层级
│   ├── ui/
│   │   ├── EvolutionCard.ts   # 进化卡（locked/unlocking/unlocked 三态）
│   │   ├── BossHpBar.ts       # Boss 血条
│   │   ├── StaminaBar.ts      # 体力条
│   │   ├── TimerDisplay.ts    # 吞噬时间
│   │   ├── WinModal.ts        # 胜利奖励弹窗
│   │   ├── LoseModal.ts       # 失败弹窗
│   │   └── CtaPage.ts         # CTA 页面
│   ├── effects/
│   │   └── EffectPlayer.ts    # 特效播放（eff_atk / eff_hit / eff_ult）
│   └── utils/
│       └── ManifestLoader.ts  # 读取 manifest.json，按需返回帧列表
├── assets/                    # 原始资源（只读）
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 6. 风险清单

| 风险 | 等级 | 说明 | 对策 |
|------|------|------|------|
| PNG 文件量大（~1,993 张）| 高 | 一次性全加载会导致首屏超时 | 按槽位按需加载；后续进化角色提前 1s 预加载 |
| 特效图分辨率高（2602×2400）| 中 | 低端机可能卡顿 | 限制同屏播放特效数量；考虑缩放后渲染 |
| bg.png 横向（3328×2048）| 中 | 设计尺寸竖屏 720×1280，需要裁剪或缩放 | Phaser Camera setBounds 或 Container 偏移裁切 |
| fish_13201、fish_13203 未在 GAME_FLOW §3.1 列出 | 低 | 资源存在但规格文档未收录 | 视为可用候选，记入 ASSUMPTIONS.md，优先用于 enemy_lose/boss_win |
| skin_fish_151011 无 eff_atk / eff_hit | 低 | 效果资源缺失 | 按动作降级规则：白闪 + 屏幕抖动 |
| 无音频资源 | 低 | 所有音效触发点需无声运行 | 预留 AudioManager 接口，默认空实现 |
