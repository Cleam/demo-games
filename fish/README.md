# 海底进化战斗 H5 游戏

竖屏 H5 海底进化试玩展示项目，基于 Vite + TypeScript + Phaser 3 构建，设计尺寸 720 × 1280。

---

## 本地开发

```bash
# 安装依赖（首次）
npm install

# 启动开发服务器（自动生成 manifest，支持热更新）
npm run dev
```

打开浏览器访问：

| 模式              | 地址                                        |
| ----------------- | ------------------------------------------- |
| 胜利流程（默认）  | `http://localhost:5173/?mode=win`           |
| 失败流程          | `http://localhost:5173/?mode=lose`          |
| 未传参（默认 win）| `http://localhost:5173/`                    |

---

## 构建

```bash
# 生产构建（输出到 dist/）
npm run build
```

构建流程：

1. `gen-manifest.js` 扫描 `assets/images/`，生成 `public/manifest.json`
2. TypeScript 类型检查（`tsc --noEmit`）
3. Vite 打包（输出 `dist/`）
4. `copy-assets.js` 将 `assets/` 复制到 `dist/assets/`，使 `dist/` 可独立部署

```bash
# 本地预览构建产物
npm run preview
```

---

## 工具命令

```bash
# 仅重新生成资源清单
npm run gen-manifest

# 仅做 TypeScript 类型检查
npm run typecheck
```

---

## 目录结构

```text
fish/
├── assets/               原始美术资源（只读，不修改）
│   ├── images/           PNG 帧序列 + bg.png + sk.png
│   ├── v1.mp4            胜利流程视觉参考
│   └── v2.mp4            失败流程视觉参考
├── docs/                 项目文档（Phase 0 产出）
├── public/
│   └── manifest.json     构建时自动生成，不手写
├── scripts/
│   ├── gen-manifest.js   扫描 assets/images/ → 生成 manifest.json
│   └── copy-assets.js    构建后将 assets/ 复制到 dist/assets/
├── src/
│   ├── main.ts           Phaser.Game 入口
│   ├── config/
│   │   ├── constants.ts  设计尺寸、层级深度常量
│   │   ├── modeConfig.ts URL mode 检测（win/lose）
│   │   └── gameConfig.ts Phaser.Types.Core.GameConfig
│   ├── core/
│   │   └── StateManager.ts 全局状态机单例
│   ├── game/
│   │   └── scenes/
│   │       ├── BootScene.ts     读取 URL 参数，初始化状态
│   │       ├── LoadingScene.ts  加载资源，显示进度条
│   │       └── GameScene.ts     主战斗场景，7 层容器架构
│   └── utils/
│       └── index.ts      通用工具函数
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 分层架构

| 层级            | Depth | 内容                       |
| --------------- | ----- | -------------------------- |
| BackgroundLayer | 0     | 海底背景图                 |
| BattleLayer     | 10    | 角色、战斗动画             |
| EffectLayer     | 20    | 攻击/命中/必杀特效         |
| HudLayer        | 30    | 顶部 HUD、血条、倒计时     |
| EvolutionLayer  | 40    | 底部进化卡片               |
| ModalLayer      | 50    | 胜利/失败弹窗              |
| CtaLayer        | 60    | CTA 页面                   |

---

## 状态机

```text
boot → loading → playing → finalBattle → resultWin  → cta
                                       → resultLose → restarting → playing
```

---

## 注意事项

- `assets/images/` 为只读资源目录，**不允许修改或删除任何文件**
- Phaser 打包体积约 1.5 MB（gzip 后约 340 KB），为正常现象
- 生产部署需要 `dist/` + `dist/assets/`（`npm run build` 已自动复制）
