# IMPLEMENTATION_PLAN.md

分阶段开发计划，基于 Phase 0 资源盘点结果制定。

---

## 1. 技术栈

| 层 | 技术 |
|----|------|
| 构建工具 | Vite 5.x |
| 语言 | TypeScript 5.x |
| 游戏引擎 | Phaser 3.x |
| 脚本（资源扫描）| Node.js（`scripts/gen-manifest.js`）|
| 目标尺寸 | 720 × 1280，竖屏 |
| 适配策略 | `Phaser.Scale.FIT`，最大化填充 |

---

## 2. 核心模块划分

```
src/
├── main.ts                    入口：创建 Phaser.Game，注册 Scene
├── config/
│   ├── assetMapping.ts        槽位 → fish ID，角色坐标/缩放/朝向/帧率
│   ├── timeline.win.ts        mode=win 的完整时间轴事件列表
│   └── timeline.lose.ts       mode=lose 的完整时间轴事件列表
├── systems/
│   ├── StateManager.ts        全局状态机（BOOT/LOADING/PLAYING/...）
│   └── TimelineRunner.ts      时间轴调度器，基于 Phaser.Time.Clock
├── actors/
│   ├── Actor.ts               角色基类（spawn/idle/move/attack/hit/die/exit）
│   └── FrameAnimPlayer.ts     PNG 帧序列播放器（循环/单次/回调/中断安全）
├── scenes/
│   ├── BootScene.ts           读取 ?mode，初始化 StateManager，跳转 Loading
│   ├── LoadingScene.ts        加载当前 mode 必需帧序列，进度条显示
│   └── GameScene.ts           主场景，管理所有层级、Actor 生命周期
├── ui/
│   ├── EvolutionCard.ts       进化卡（locked → unlocking → unlocked 三态）
│   ├── BossHpBar.ts           Boss 血条（win mode）
│   ├── StaminaBar.ts          体力条（lose mode 最终战斗）
│   ├── TimerDisplay.ts        吞噬时间倒计时（lose mode）
│   ├── WinModal.ts            胜利奖励弹窗
│   ├── LoseModal.ts           失败弹窗（重新挑战 / 退出挑战）
│   └── CtaPage.ts             CTA 页面（隐藏战斗层，展示主角与按钮）
├── effects/
│   └── EffectPlayer.ts        特效帧序列播放（eff_atk/eff_hit/eff_ult），降级支持
└── utils/
    └── ManifestLoader.ts      从 public/manifest.json 查询帧路径列表
```

---

## 3. 分阶段开发计划

### Stage 0（当前）：资源与项目盘点

- [x] 阅读 GAME_FLOW.md、VIDEO_ANALYSIS.md
- [x] 扫描 assets/images 目录
- [x] 输出 PROJECT_DISCOVERY.md
- [x] 输出 ASSET_INVENTORY.md
- [x] 输出 IMPLEMENTATION_PLAN.md（本文件）
- [x] 输出 ASSUMPTIONS.md

---

### Stage 1：工程脚手架

**目标**：可启动空白 Phaser 场景，构建不报错。

任务：
1. `npm init` → 安装 `vite`、`phaser`、`typescript`
2. 配置 `vite.config.ts`：publicDir = `assets`，assetsInclude 含 `*.png`
3. 配置 `tsconfig.json`：strict 模式，path alias `@/*` → `src/*`
4. 编写 `scripts/gen-manifest.js`：
   - 递归扫描 `assets/images/`
   - 过滤 `Thumbs.db`、`.DS_Store`
   - 按 fish ID / action / 帧序号分组
   - 输出 `public/manifest.json`
5. 在 `vite.config.ts` 中注册 `gen-manifest` 为 `buildStart` 钩子
6. 空白 `index.html` + `BootScene` 只打日志
7. 验证：`npm run dev` → 浏览器无报错；`tsc --noEmit` 通过；`manifest.json` 生成正确

---

### Stage 2：核心系统

**目标**：StateManager + TimelineRunner 可独立单测。

任务：
1. **StateManager**
   - 实现状态枚举与转换规则
   - 提供 `enter(state)` 方法，触发对应 `onEnter` 回调
   - 禁止外部绕过状态机直接修改状态

2. **TimelineRunner**
   - 接受事件列表（`{ at: number, type: string, ... }[]`）
   - 基于 `Phaser.Time.Clock` 调度（非 `setTimeout`）
   - 支持 `start()` / `stop()` / `reset()`
   - `stop` + `reset` 必须清空所有待执行事件

3. **配置文件骨架**
   - `assetMapping.ts`：定义槽位 → fish ID 映射，角色位置/缩放配置
   - `timeline.win.ts` / `timeline.lose.ts`：按 GAME_FLOW.md §10.3 / §11.3 逐条填写事件

4. 验证：手写单元测试（或 console 驱动）确认时间轴事件触发顺序正确

---

### Stage 3：角色动画系统

**目标**：任意角色可播放 idle / attack / die 动画。

任务：
1. **ManifestLoader**：读取 `manifest.json`，提供 `getFrames(fishId, action)` → `string[]`

2. **FrameAnimPlayer**
   - 接受帧路径列表，在 Phaser Sprite 上播放
   - 支持循环（idle/move）和单次（atk/die）
   - 单次播放结束后触发回调
   - 中断安全：随时可切换动作，不残留旧帧事件

3. **Actor 基类**
   - 持有 Phaser.GameObjects.Sprite
   - 提供 `spawn(x, y)` / `idle()` / `move(toX, duration)` / `attack()` / `hit()` / `die()` / `exit()` 方法
   - 内部调用 `FrameAnimPlayer` 切换帧序列
   - 动作降级：缺失资源时自动降级（参考 ASSET_INVENTORY.md §7）

4. 验证：在 GameScene 中放置一个 Actor，依次播放所有动作，确认无跳帧、无乱序

---

### Stage 4：胜利流程（mode=win）

**目标**：完整播放 win 流程，含 4 次进化 + Boss 战 + 奖励弹窗 + CTA。

任务：
1. LoadingScene 根据 mode=win 加载所需槽位帧序列
2. GameScene 初始化 7 个层级（参考 GAME_FLOW.md §5.2）
3. 实现 `starter` spawn → `idle` → `attack` 循环
4. 实现 `evolution_1`～`final_actor` 依次替换（TimelineRunner 触发）
5. 实现 Boss 出场 + Boss HP Bar 下降（时间轴控制，非真实计算）
6. Boss 死亡 → WinModal 显示 → 点击"领取" → CtaPage
7. 验证：浏览器打开 `?mode=win`，完整看完流程，4 张进化卡顺序解锁，Boss 血条归零，弹窗可点击

---

### Stage 5：失败流程（mode=lose）

**目标**：完整播放 lose 流程，含进化 + 最终对抗 + 失败弹窗 + 重试（10 次无残留）。

任务：
1. LoadingScene 加载 mode=lose 所需槽位（含 enemy_lose）
2. enemy_lose 在初始帧已在左侧背景位置显示
3. 最终战斗：体力条 + 吞噬时间显示并递减（时间轴控制）
4. final_actor 受击动画、缩小、退场
5. LoseModal 显示：
   - "重新挑战" → `RESTARTING` → 完整清理 → 重播 lose 流程
   - "退出挑战" → CtaPage
6. **重试清理清单**（严格检查）：
   - TimelineRunner.reset()
   - 所有 Actor destroy()
   - 所有 Effect destroy()
   - EvolutionCard 重置为初始态
   - BossHpBar / StaminaBar / TimerDisplay 重置
   - 弹窗隐藏
   - 输入锁定解除
7. 验证：连续点击"重新挑战" 10 次，无重复角色、无多个倒计时、无 UI 残留、无 JS 报错

---

### Stage 6：HUD 与 UI 完善

**目标**：所有 UI 组件按 GAME_FLOW.md §13 规范显示/隐藏。

任务：
1. **EvolutionCard**
   - `locked`：剪影、灰化、等级解锁文案
   - `unlocking`：高亮闪光动画、进度条充满
   - `unlocked`：真实角色图、"已解锁"标识
2. **HUD 显示规则**（按 §13.2 表格）：不同阶段切换 Boss血条/体力条/吞噬时间 可见性
3. 顶部关卡标题（"第 185 关"样式）、排行榜入口按钮
4. 所有弹窗按钮防重复点击（设置 `setInteractive(false)` 后重置）
5. 验证：两个 mode 各跑一遍，核对 §13.2 每行的显示/隐藏状态

---

### Stage 7：特效与视觉打磨

**目标**：攻击特效、命中特效、必杀特效可播放，视觉节奏接近参考视频。

任务：
1. **EffectPlayer**
   - 在 EffectLayer 上创建临时 Sprite，播放 eff_atk/eff_hit/eff_ult 帧序列
   - 播放结束后自动销毁
   - 降级方案：无资源时用程序生成的圆形扩散或白闪
2. 进化特效（unlock 时）：可复用 eff_ult 或程序生成放大光圈
3. 屏幕闪白 / 震动（hit 时）：Camera.shake()，持续 100ms
4. 背景层：bg.png 按 720×1280 居中裁切，sk.png 视情况叠加
5. 验证：对照 VIDEO_ANALYSIS.md 时间点，确认节奏基本一致

---

### Stage 8：构建验证与验收

**目标**：满足 GAME_FLOW.md §16 全部验收标准。

任务：
1. `tsc --noEmit` 无错误
2. `npm run build` 成功，dist/ 无缺失资源
3. `npx serve dist` → 手机浏览器（或模拟器）打开，验证 720×1280 适配
4. 验收清单逐项检查（见下方）
5. 修复所有阻塞性问题

---

## 4. 资源加载策略

```
manifest.json（构建时生成）
     │
     ├── LoadingScene：加载当前 mode 的槽位资源
     │     starter + evolution_1~4 + final_actor
     │     + boss_win（win mode）或 enemy_lose（lose mode）
     │
     └── 运行时预加载：
           在 evolution_N 解锁前约 1s，触发 evolution_N+1 的资源加载
           避免下一次进化时出现加载等待
```

**绝对禁止**：一次性 `preload()` 全部 1,993 张 PNG。

---

## 5. 性能风险与对策

| 风险 | 对策 |
|------|------|
| 特效图 2602×2400 过大 | EffectPlayer 创建时设置 `setScale(0.5)`；若仍卡顿，考虑离屏 Canvas 降采样 |
| 同屏多个角色 + 特效并发 | 限制同时播放特效不超过 3 个；完成后立即 destroy |
| bg.png 横向图 | 用 Phaser Container 或 setOrigin + Camera.setBounds 居中裁切，避免拉伸 |
| 重试后内存不释放 | 每次 RESTARTING 时调用 `this.scene.restart()` 或手动 destroy 所有 GameObject |

---

## 6. 验收清单（Stage 8 执行）

### 基础验收
- [ ] `?mode=win` 正常启动
- [ ] `?mode=lose` 正常启动
- [ ] 未传 mode 时默认进入 win
- [ ] 720×1280 比例正确
- [ ] 360×640、390×844、430×932 下关键 UI 不裁切
- [ ] 原始 assets/images 未被修改
- [ ] Thumbs.db 未参与加载
- [ ] `npm run build` 成功

### 资源验收
- [ ] 主要角色播放 idle、attack、die/ult 动画
- [ ] 至少一种攻击特效可播放
- [ ] 至少一种命中特效可播放
- [ ] 进化特效可呈现（资源或降级效果）
- [ ] 动画帧顺序正确，无乱序跳帧

### 胜利流程验收
- [ ] 4 张进化卡按顺序解锁
- [ ] Boss 出现
- [ ] Boss 血条下降并归零
- [ ] Boss 死亡/退出
- [ ] 胜利奖励弹窗显示
- [ ] 点击"领取"进入 CTA
- [ ] CTA 不继续触发战斗事件

### 失败流程验收
- [ ] 4 张进化卡按顺序解锁
- [ ] 最终敌人进入主要对抗位置
- [ ] 体力条和吞噬时间正常显示并下降
- [ ] 最终角色失败后显示失败弹窗
- [ ] 点击"重新挑战"可从 0s 完整重播
- [ ] 连续重试 10 次无残留
- [ ] 点击"退出挑战"进入 CTA
