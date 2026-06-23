# Fish H5 试玩项目开发指南

本文档面向后续维护和微调此项目的开发者，重点说明：

- 素材如何替换
- 文案在哪里改
- hero / npc / boss 的尺寸、位置、朝向、吸食距离如何调
- trim 数据是怎么生成和使用的
- 背景滚动、吸食特效、升级节奏、结算页、CTA 在哪里调
- 出现“角色不见了 / 在屏幕外 / 比例不协调 / 吸食位置不对”时应该从哪里排查

---

## 1. 项目当前核心逻辑

当前项目已经不再使用旧的 `fish_*` 战斗时间轴作为主流程，而是采用新的资源语义：

- `assets/images/hero/lv0 ~ lv120`
  - hero 各等级主角
  - 当前默认只使用 `atk` 序列
- `assets/images/npc/01 ~ 05`
  - hero 前方可被吸食的鱼群
  - 当前默认只使用 `idle` 序列
- `assets/images/boss.png`
  - `lose` 模式尾随 boss
- `assets/images/as1.png`
  - 底部进化面板裁切源图
- `assets/images/as2.png`
  - 顶部 HUD 背景图
- `assets/images/bg.png`
  - 主背景

主流程逻辑：

1. hero 从 `lv0` 开始
2. npc 按 `01 -> 02 -> 03 -> 04 -> 05` 出现
3. hero 吸食一波 npc 后升级
4. 升满到 `lv120`
5. `win` 进入胜利结算
6. `lose` 由 boss 反向吸食 hero，进入失败结算

---

## 2. 先看哪些文件

### 主流程与演出

- `src/game/scenes/GameScene.ts`

这里是最重要的文件，控制：

- 背景滚动
- hero 出场、升级、追击
- npc 波次生成
- 吸食路径
- boss 尾随与反吸
- 结算页与 CTA
- 底部进化面板联动

### npc 波次生成

- `src/game/actors/NpcWaveController.ts`

这里控制：

- 每波 npc 的数量
- 每波 npc 的可视尺寸
- 每波 npc 的生成位置
- 编队间距
- 相对 hero 嘴部的安全距离

### hero / boss / npc 通用角色渲染

- `src/game/actors/Actor.ts`

这里控制：

- 应用 `trim` 后的 origin
- `flipX`
- 透明度
- 移动
- tween
- mouth anchor 世界坐标计算

### trim 数据读取

- `src/utils/ManifestLoader.ts`

这里提供：

- hero 帧读取
- npc 帧读取
- boss 贴图读取
- trim 数据读取
- 可视包围盒尺寸读取

### trim 数据生成脚本

- `scripts/gen-manifest.js`

这里是构建期资源扫描与元数据生成入口，负责：

- 扫描 hero / npc / boss
- 忽略 `_tmp`
- 解析 PNG 透明边界
- 生成 `public/manifest.json`

### 等级、名称、卡片文案

- `src/config/progression.ts`

这里控制：

- hero 等级枚举
- npc 波次枚举
- 每波 npc 数量
- hero 名称
- 属性文案
- 等级解锁文案

### 底部进化面板

- `src/ui/EvolutionCard.ts`

这里控制：

- 竖排卡片样式
- 当前高亮
- 已解锁 / 未解锁状态
- 经验条 / 按钮文案

### 结算页与 CTA

- `src/ui/WinModal.ts`
- `src/ui/LoseModal.ts`
- `src/ui/CtaPage.ts`

---

## 3. 资源目录规范

### hero

目录：

```text
assets/images/hero/lv0
assets/images/hero/lv30
assets/images/hero/lv60
assets/images/hero/lv90
assets/images/hero/lv120
```

约定：

- 当前只扫描文件名包含 `-atk_` 的 PNG
- 不要求手工合图
- 每帧会在构建期自动计算非透明区域

### npc

目录：

```text
assets/images/npc/01
assets/images/npc/02
assets/images/npc/03
assets/images/npc/04
assets/images/npc/05
```

约定：

- 当前只扫描文件名包含 `-idle_` 的 PNG
- `01 ~ 04` 当前默认各 6 条
- `05` 当前默认 1 条

### boss

目录：

```text
assets/images/boss.png
```

约定：

- 当前是单张图
- 没有帧动画
- 朝向通过代码 `flipX` 控制

### UI

- `bg.png`
- `as1.png`
- `as2.png`

这些都由 `LoadingScene` 预加载。

---

## 4. trim 数据机制

这是当前项目最关键的一层。

问题背景：

- 很多 PNG 的透明留白非常大
- 不能按原图宽高直接决定缩放和位置
- 否则会出现：
  - 角色看起来很小
  - npc 明明生成了，但其实在屏幕外
  - hero 在吸食，但嘴和 npc 相距很远
  - 升级后尺寸梯度不明显

### trim 是如何生成的

脚本：

- `scripts/gen-manifest.js`

生成过程：

1. 读取 PNG 像素
2. 找出 alpha > 0 的最小包围盒
3. 记录：
   - `sourceWidth`
   - `sourceHeight`
   - `bounds`
   - `renderOffset`
   - `centerAnchor`
   - `mouthAnchor`

输出文件：

- `public/manifest.json`

### trim 如何被运行时使用

运行时读取：

- `ManifestLoader.getTrimmedFrame(url)`
- `ManifestLoader.getVisibleBoundsSize(url)`

主要用途：

- `Actor.applyPose()` 用 `centerAnchor` 修正 origin
- `GameScene.scaleForVisibleWidth()` 用 `bounds.width` 算缩放
- `NpcWaveController` 用 `bounds.width` 算 npc 的真实可视宽度
- `Actor.getMouthWorldPoint()` 用 `mouthAnchor` 算嘴的位置

### 重要结论

后续所有尺寸、站位、吸食距离问题，都应该优先基于 `trim.bounds` 调整，而不是基于原 PNG 大小。

---

## 5. 如何替换 hero / npc / boss 素材

### 替换 hero 皮肤

步骤：

1. 将新 hero 帧放入对应目录，例如：

```text
assets/images/hero/lv90/
```

2. 文件名保持包含 `-atk_`
3. 执行：

```bash
npm run build
```

或：

```bash
npm run dev
```

这样会自动重新生成 `manifest.json`

### 替换 npc 皮肤

步骤同上，只是目录改为：

```text
assets/images/npc/01 ~ 05
```

并确保文件名包含 `-idle_`

### 替换 boss 皮肤

直接替换：

```text
assets/images/boss.png
```

如果替换后朝向不对，改：

- `src/game/scenes/GameScene.ts`
- `getBossPose()`

调整：

```ts
flipX: true
```

或：

```ts
flipX: false
```

---

## 6. 如何调文案

### hero 名称、属性、战力

文件：

- `src/config/progression.ts`

修改对象：

```ts
export const HERO_LEVEL_INFO
```

可调字段：

- `label`
- `title`
- `statLabel`
- `powerLabel`
- `levelRequired`

### 关卡标题

文件：

- `src/game/scenes/GameScene.ts`

查找：

```ts
'第185关'
```

### 页面主标题

文件：

- `src/game/scenes/GameScene.ts`

查找：

```ts
'海底幽牢'
```

### CTA / 结算文案

文件：

- `src/ui/WinModal.ts`
- `src/ui/LoseModal.ts`
- `src/ui/CtaPage.ts`

---

## 7. 如何调 hero 尺寸

文件：

- `src/game/scenes/GameScene.ts`

重点函数：

```ts
private getHeroPose(level: HeroLevel)
```

这里有一组关键数据：

```ts
const targetVisibleWidth: Record<HeroLevel, number>
```

这不是原图宽度，而是：

- “希望 hero 在屏幕上看起来有多宽”

运行时会通过：

```ts
scale = visibleWidth / trim.bounds.width
```

来反推出真实 `scale`

### 建议调整方式

如果你觉得：

- `lv0` 太小：调大 `lv0`
- `lv90` 不够压迫：明显调大 `lv90`
- `lv120` 终态不够大：继续调大 `lv120`

建议不要只做很小的线性递增，最好拉开明显的体型阶梯。

### 同时要调的另一个点

还是这个函数里：

```ts
y: ...
```

因为角色越大，视觉落地位置通常也要稍微往下压，否则会像飘起来。

---

## 8. 如何调 npc 尺寸与生成位置

文件：

- `src/game/actors/NpcWaveController.ts`

重点配置：

```ts
const NPC_WAVE_LAYOUT
```

每一波都可以调：

- `visibleWidth`
- `gapX`
- `gapY`
- `mouthGap`
- `baseY`

含义如下：

- `visibleWidth`
  - 这一波 npc 在屏幕上的目标可视宽度
  - 最终会基于 trim 包围盒推导出真实 `scale`
- `gapX`
  - 同排鱼之间的横向间距
- `gapY`
  - 上下两排之间的纵向间距
- `mouthGap`
  - 这波鱼生成在 hero 嘴前多远
- `baseY`
  - 这一波整体的基础纵向落点

### 如果 npc 在屏幕外

优先检查：

- `mouthGap` 是否过大
- `visibleWidth` 是否过大
- 当前 hero 是否太大，导致嘴部位置太靠右

当前逻辑里已经有一层安全钳制：

- 会根据 `GAME_WIDTH` 自动把整波 npc 压回屏幕内

但如果你把 `visibleWidth` 和 `gapX` 调得特别夸张，仍然会挤压布局。

### 如果 hero 吸食时和 npc 距离太远

优先调：

- `mouthGap`
- `gapX`
- `baseX` 已取消硬编码，不建议再恢复

如果还不对，再检查：

- hero 的 `mouthAnchor`
- hero 的 `targetVisibleWidth`

---

## 9. 如何调 hero 追击与吸食距离

文件：

- `src/game/scenes/GameScene.ts`

重点函数：

```ts
private getHeroChasePose()
```

这里控制 hero 在正式吸食前会往前冲多远。

可调项：

- `x: pose.x + ...`
- `y: pose.y - ...`
- `scale: pose.scale * ...`

如果你觉得：

- hero 追得不够：增大 `x`
- hero 太顶脸：减小 `x`
- 前冲时不够有力度：略增大 `scale`

### 吸食轨迹

函数：

```ts
private consumeNpc(...)
```

可调项：

- `duration`
- `angle`
- `radius`
- 缩放衰减
- alpha 衰减

如果你觉得卷入感不够：

- 增大 `radius`
- 拉长 `duration`
- 调大角速度

如果你觉得拖沓：

- 缩短 `duration`
- 减少 `radius`

---

## 10. 如何调升级节奏

文件：

- `src/game/scenes/GameScene.ts`

重点函数：

- `startFlow()`
- `playWave()`
- `upgradeHero()`

可调内容：

- 每波等待时间
- hero 前冲节奏
- 吸食启动时机
- 升级爆闪时长
- 新 hero 接位时长

### 升级出场

`upgradeHero()` 里会做：

1. 爆闪
2. 旧 hero fade out
3. 新 hero 从嘴附近接位
4. tween 到正式 pose

如果你觉得升级不够爽：

- 加长 `playBurst`
- 加大新旧体型差
- 增强新 hero 初始缩放反差

---

## 11. 如何调 boss

文件：

- `src/game/scenes/GameScene.ts`

重点函数：

- `spawnLoseBoss()`
- `getBossPose()`
- `followBossBehindHero()`
- `playLoseEnding()`

### 朝向

改：

```ts
flipX
```

### 尺寸

改：

```ts
scale: this.scaleForVisibleWidth(bossFrame, 420)
```

这里的 `420` 是 boss 的目标可视宽度。

### 尾随距离

改：

```ts
x: this.heroActor.x - 258
y: this.heroActor.y - 42
```

### 失败时反吸

`playLoseEnding()` 里可调：

- boss 逼近时长
- stamina 下降段数
- hero 被卷走的旋转半径
- hero 缩小速度

---

## 12. 如何调背景与前进感

文件：

- `src/game/scenes/GameScene.ts`

重点函数：

- `createBackground()`
- `update()`

### 主背景

当前是双背景拼接循环：

- `bg1`
- `bg2`

通过 `scrollingObjects` 左移。

### 前景层

当前参与滚动的有：

- 海草
- 礁石

每种对象的：

- `speed`
- `wrapX`
- `resetX`

都可以单独调。

如果想更有景深：

- 远景速度更慢
- 近景速度更快

---

## 13. 如何调进化面板与 UI

### 进化卡

文件：

- `src/ui/EvolutionCard.ts`

可调内容：

- 卡片尺寸
- 头像区域
- 标题字号
- 按钮状态色
- 经验条颜色

### 顶部 HUD

文件：

- `src/game/scenes/GameScene.ts`

可调内容：

- 标题字号
- 关卡条位置
- `as2` 缩放

### 结算页与 CTA

文件：

- `src/ui/WinModal.ts`
- `src/ui/LoseModal.ts`
- `src/ui/CtaPage.ts`

这里可以继续微调：

- 主角展示图
- 标题字号
- 按钮颜色
- 底图氛围

---

## 14. 常见问题排查

### 问题 1：hero 在吸食，但 npc 没出现

优先排查：

1. `NpcWaveController.ts` 的 `mouthGap` 是否过大
2. `visibleWidth` 是否过大导致整波被挤出右边
3. `heroMouth` 是否异常
4. `manifest.json` 中该波第一帧的 `trim.bounds.width` 是否异常

建议命令：

```bash
node -e "const m=require('./public/manifest.json'); console.log(m.npcWaves['01'].idle[0], m.trimData[m.npcWaves['01'].idle[0]])"
```

### 问题 2：角色比例失衡

优先排查：

1. 是否只看了 PNG 原始宽度
2. `trim.bounds.width` 是否差异巨大
3. `targetVisibleWidth` 或 `visibleWidth` 是否设置不合理

原则：

- 只能基于 trim 后的可视宽度调比例
- 不要基于原图宽高做视觉判断

### 问题 3：hero 嘴和吸食点对不上

优先排查：

1. `scripts/gen-manifest.js` 自动生成的 `mouthAnchor`
2. `Actor.getMouthWorldPoint()`
3. 当前 `flipX` 是否符合朝向

如果某个等级偏差明显，最稳妥的方案是：

- 在脚本里加一层“每个等级手调 mouth anchor 覆盖表”

### 问题 4：hero 升级后还是半透明

优先排查：

- `GameScene.ts -> upgradeHero()`

确认最终 tween 是否明确写了：

```ts
alpha: 1
```

### 问题 5：boss 朝向不对

优先排查：

- `getBossPose().flipX`

---

## 15. 建议的微调顺序

如果要继续做视频级还原，建议按这个顺序调：

1. 先确认素材身份
   - 哪个 hero 对应哪个等级
   - 哪个 npc 对应哪一波
2. 再确认 trim 是否合理
   - 看 `manifest.json`
3. 调 hero 体型梯度
4. 调 npc 各波尺寸梯度
5. 调 hero 嘴前距离 `mouthGap`
6. 调 hero 前冲距离
7. 调吸食旋涡轨迹
8. 调背景滚动速度
9. 最后调卡片、结算页和 CTA 细节

不要一开始就疯狂改 `x/y/scale`，否则很容易把问题越修越乱。

---

## 16. 常用命令

开发模式：

```bash
npm run dev
```

类型检查：

```bash
npm run typecheck
```

完整构建：

```bash
npm run build
```

只重建 manifest：

```bash
npm run gen-manifest
```

---

## 17. 后续建议

如果项目后面还要继续高频微调，建议新增两层配置：

### 1. hero / npc 的手工覆盖表

例如：

- 每个等级 hero 的 `mouthAnchor`
- 每波 npc 的 `visibleWidth`
- 每波 npc 的 `mouthGap`
- 每个等级 hero 的 `targetVisibleWidth`

这样后续就不需要去主场景里翻逻辑代码。

### 2. 可视调参面板

可以考虑做一个 debug 模式，允许实时调：

- hero 尺寸
- npc 尺寸
- 吸食距离
- 追击距离
- boss 距离
- 背景滚动速度

这样还原视频会快很多。

---

## 18. 最后提醒

当前项目里最容易踩坑的点只有一个：

**不要再按原始 PNG 外框判断角色大小和位置。**

必须优先看：

- `public/manifest.json`
- `trim.bounds`
- `centerAnchor`
- `mouthAnchor`

这套数据才是当前项目里真正决定“角色在屏幕上看起来多大、站在哪里、嘴在哪里”的依据。
