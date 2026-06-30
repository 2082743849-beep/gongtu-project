# 空间几何实验室 Agent 交接手册

更新时间：2026-06-30

## 1. 接手时先做什么

新 Agent 必须按顺序完成以下只读检查，再修改任何文件：

1. 阅读项目根目录 `.ai_rules.md`。
2. 阅读 `TASKS.md` 的“当前验收摘要”和当前里程碑。
3. 阅读 `CURRENT_STATUS.md` 的当前任务、验收记录、风险与下一步。
4. 阅读 `doc/GEOMETRY_ARCHITECTURE.md`。
5. 阅读本文件。
6. 执行：

```bash
git status --short --branch
git branch --show-current
git log -5 --oneline --decorate
git diff
```

如果分支、工作区或下一任务与文档不一致，先停止业务修改，查清差异并更新状态。不得猜测，不得使用 `git reset --hard`。

## 2. 唯一正确工作位置

当前规划与纠偏工作树：

```text
/Users/xixi/Documents/Codex/2026-06-29/new-chat/work/gongtu-cutfix-plan
```

当前规划与纠偏分支：

```text
feature/spatial-geometry-cutfix-plan
```

远端跟踪分支：

```text
origin/feature/spatial-geometry-cutfix-plan
```

稳定分支 `main` 禁止直接开发、提交或强推。

原项目目录曾同时进行 Windows 兼容开发，可能被另一个流程切换分支：

```text
/Users/xixi/原来的电脑文件/知识就是力量/融合版/ui尝试改进首页 - workbuddy跑
```

空间几何 Agent 不应在原项目工作树继续写代码，以免与 `feature/windows-compat` 并发互相切换 HEAD。应使用上面的独立 `gongtu-spatial` 工作树。

## 3. 产品目标不能理解错

用户已用 42 秒参考视频重新确认产品目标。核心不是“切完后去下面看二维结果”，也不是用巨大红色平面
遮住模型并默认裁掉一半，而是：

1. 默认“截面教学模式”保留完整模型，必要时只降低模型透明度。
2. 只把数学切面与模型真实相交的区域填充为清晰蓝色，并显示蓝色轮廓。
3. 切面连续平移、旋转或两轴倾斜时，蓝色截面必须逐帧连续更新。
4. 默认第一体验是水平切面从模型顶部进入，连续向下穿过模型，再从底部离开。
5. 数学切面仍是无限平面，但视觉刀面只显示在模型包围盒附近、可弱化或隐藏，禁止铺满屏幕。
6. “真实剖开模式”是辅助模式：只有用户主动开启后，才隐藏或透明显示被切侧并显示切口封面。
7. 正式题库模式仍可由题目给出的 A、B、C 三点唯一确定无限平面。
8. 二维截面图只能作为可选辅助，不能替代 3D 场景中的实时蓝色截面。

用户参考视频：

```text
/Users/xixi/Downloads/douyin/@公考志远（立体图推数资分享） 选项越简单越容易失误，一定要小心谨慎！ 4K.mp4
```

该视频只作为产品行为参考，不得复制其中版权素材进入仓库。

AI 建模与数学求解必须分离：

- AI 只把图片和文字转换成待确认的 Geometry JSON 草稿。
- 截面、投影、相交和答案由确定性几何算法计算。
- 图片遮挡信息不足时必须标记不确定，禁止 AI 编造结构。

## 4. 当前已经完成什么

以 `TASKS.md` 的勾选和 Git 历史为最终依据。目前已经具备：

- AI 协作章程、用户验收看板和当前状态记录。
- 模块架构、技术边界、风险与阶段验收标准。
- 精确锁定的 Three.js、three-mesh-bvh、three-bvh-csg 依赖和 lockfile。
- GitHub Actions 前端 JavaScript 基础检查。
- `/geometry` FastAPI 页面路由。
- 空间几何实验室响应式页面骨架。
- 本地 Three.js WebGL 渲染器、透视相机和三点布光。
- OrbitControls 旋转、缩放、平移、阻尼与视角复位。
- 三维地面网格、XYZ 坐标轴、原点标记、方向标签与页面颜色图例。
- 长方体、正方体、三棱柱、三棱锥、圆柱、圆锥和球体七类参数化模型。
- 七类动态参数、颜色、透明度控制，以及统一网格落位。
- 基础模型生成器、平面求交、交点排序闭合、截面度量和典型切面算法测试。
- 截面填充、切侧显示和二维辅助视图已有可复用模块。
- 积木阵列、组合模型与 CSG 能力已进入 M3。

注意：上述组件和算法完成不等于用户要求的端到端截面教学体验已完成。M2 已重新进入体验纠偏，
必须完成 CUT-FIX-002 至 CUT-FIX-007，才能恢复 COM-007。

接手时不得重写这些基础设施。需要调整时，先在 `TASKS.md` 建立修复或重构任务并写清理由。

## 5. 继续任务的固定流程

每次只执行 `TASKS.md` 中“下一项”：

1. 确认分支和工作区干净。
2. 从 `feature/spatial-geometry-cutfix-plan` 建立隔离任务分支，并将任务保持为唯一当前任务。
3. 修改不超过 3 个交付文件。
4. 必须同步修改 `TASKS.md` 和 `CURRENT_STATUS.md`。
5. 执行与风险匹配的测试。
6. 只有测试通过才能把任务改成 `- [x] ●`。
7. 提交信息必须与任务名称一致。
8. 立即推送当前隔离任务分支，等待主协调 Agent 审查；不得自行合并。
9. 回复用户时直接展示更新后的 `TASKS.md` 片段。

交付文件最多 3 个；`TASKS.md` 和 `CURRENT_STATUS.md` 是强制审计文件，不计入交付文件上限。

## 6. 常用验收命令

### Git 和看板

```bash
git diff --check
git status --short --branch
rg -c '^- \[x\] ●' TASKS.md
```

### JavaScript

```bash
node --check geometry/scene.js
npm ci --ignore-scripts --no-audit --no-fund
npm run deps:check
npm run test:geometry
```

### Python

项目专用虚拟环境：

```text
/Users/xixi/Workbuddy/2026-06-28-19-13-40/venv
```

示例：

```bash
/Users/xixi/Workbuddy/2026-06-28-19-13-40/venv/bin/ruff check backend/ --select=E,F --ignore=E501
/Users/xixi/Workbuddy/2026-06-28-19-13-40/venv/bin/mypy backend/ --ignore-missing-imports --follow-imports=skip --disable-error-code var-annotated
/Users/xixi/Workbuddy/2026-06-28-19-13-40/venv/bin/bandit -r backend/ -ll --exclude '**/venv/**'
```

### 本地浏览器验收

根目录 `node_modules` 不提交。需要浏览器测试时：

1. 在临时目录执行 `npm ci`。
2. 临时把该目录的 `node_modules` 链接到工作树根目录。
3. 使用项目虚拟环境启动 FastAPI。
4. 访问 `http://127.0.0.1:8765/geometry`。
5. 测试结束后停止服务并删除临时链接。

不得把临时 `node_modules`、`.env`、数据库或缓存加入提交。

## 7. 当前代码契约

页面：

```text
geometry.html
```

Three.js 场景入口：

```text
geometry/scene.js
```

页面通过 import map 将裸导入 `three` 固定到：

```text
/node_modules/three/build/three.module.js
```

`geometry/scene.js` 在 Canvas 上写入可观测状态，浏览器测试可读取：

- `data-scene-ready`
- `data-renderer`
- `data-camera`
- `data-camera-position`
- `data-camera-target`
- `data-light-count`
- `data-clipping`
- `data-orbit-controls`
- `data-zoom-range`
- `data-coordinate-helpers`
- `data-active-model`
- `data-active-model-bounds`
- `data-cutting-plane`
- `data-cutting-plane-extent`
- `data-cutting-plane-normal`
- `data-cutting-plane-constant`

后续模块可以使用页面主世界的只读入口：

```text
window.geometryLab
```

其中包含 `THREE`、`scene`、`camera`、`renderer`、`controls` 和 `lights`。

## 8. 已知风险

1. `three-bvh-csg` 是实验性库，不能作为截面数学正确性的唯一来源。
2. CSG 输入必须是封闭、无自交的二流形网格。
3. 截面计算要有独立数学测试，不能只凭截图判断。
4. `backend/main.py` 的 catch-all 静态路由可以提供 npm 模块，但正式部署必须执行根目录 `npm ci`。
5. Electron 打包是否包含根目录依赖尚未验收，不得提前宣称桌面端完成。
6. 首次加载必须显示默认正方体；只显示网格说明模型初始化失败。
7. 当前默认隐藏/裁剪模型的一侧，偏离用户要求的默认教学模式。
8. 当前视觉刀面过大、过亮，会遮挡模型和真实截面。
9. 默认切面方向与移动轴尚未实现“从顶部连续向下穿模”的第一体验。
10. 阶梯组合体需要验证切面与多个分离/相连区域的稳定闭合，不能只凭基础模型单测推断。
11. COM-006 的 v2 截图尚未通过主线程验收，仰视构图和复位状态不得宣称完成。
12. `feature/spatial-geometry-cut011-agent` 有未验收提交和未提交文件，禁止清理或覆盖。

## 9. 当前继续点

新 Agent 必须以 `TASKS.md` 为准。当前唯一产品继续点是：

```text
CUT-FIX-002 feat: 建立默认水平切面连续穿模
```

COM-007 明确暂停。必须依次完成 CUT-FIX-002 至 CUT-FIX-007，并通过参考视频体验验收后才能恢复。

## 10. 禁止事项

- 禁止直接修改或提交 `main`。
- 禁止在原项目工作树和独立功能工作树之间来回切换同一分支。
- 禁止清理、覆盖或提交不属于当前任务的用户文件。
- 禁止让 AI 直接输出并执行 JavaScript 模型代码。
- 禁止把视觉裁剪当成真实截面计算。
- 禁止把巨大红色视觉平面当成默认教学体验。
- 禁止默认隐藏模型一侧；真实剖开只能由用户主动开启。
- 禁止只凭静态截图或算法单测宣称连续截面体验完成。
- 禁止任务未验收就打勾。
- 禁止只在聊天中报告完成而不真实修改 `TASKS.md`。
- 禁止一次完成多个看板任务后只做一个大提交。

## 11. Agent 2 隔离分支方案

不新建仓库。新仓库会失去现有提交历史、CI、任务看板和可审查的共同基线。

采用三个远端分支：

| 分支 | 用途 | 谁能写 |
|---|---|---|
| `feature/spatial-geometry-lab` | Agent 1 已验收的整合基准 | Agent 2 禁止写入 |
| `backup/spatial-geometry-checkpoint-20260629` | 只读事故恢复点 | 所有 Agent 禁止写入 |
| `feature/spatial-geometry-agent2` | Agent 2 接力开发 | Agent 2 只能写这里 |

Agent 2 必须使用独立工作树，不能复用 Agent 1 的工作目录：

```text
/Users/xixi/Documents/Codex/2026-06-29/new-chat/work/gongtu-agent2
```

建议创建方式：

```bash
git fetch origin --prune
git worktree add \
  /Users/xixi/Documents/Codex/2026-06-29/new-chat/work/gongtu-agent2 \
  feature/spatial-geometry-agent2
```

Agent 2 接手后必须确认：

```bash
git branch --show-current
git status --short --branch
git merge-base --is-ancestor \
  origin/feature/spatial-geometry-lab \
  feature/spatial-geometry-agent2
```

Agent 2 每完成一个任务必须：

1. 更新并打勾 `TASKS.md`。
2. 更新 `CURRENT_STATUS.md`。
3. 在 `doc/AGENT_WORK_LOG.md` 追加本 Agent 的任务记录。
4. 执行任务验收。
5. 用任务原名提交。
6. 推送 `origin/feature/spatial-geometry-agent2`。
7. 禁止合并、变基、强推或删除任何基准/备份分支。

## 12. Agent 1 返回后的审核流程

Agent 1 恢复后不得直接相信“已完成”，必须：

```bash
git fetch origin --prune
git log --oneline --decorate \
  origin/feature/spatial-geometry-lab..origin/feature/spatial-geometry-agent2
git diff --stat \
  origin/feature/spatial-geometry-lab...origin/feature/spatial-geometry-agent2
git diff \
  origin/feature/spatial-geometry-lab...origin/feature/spatial-geometry-agent2
```

然后按顺序执行：

1. 核对 `TASKS.md`、`CURRENT_STATUS.md` 和 `AGENT_WORK_LOG.md` 是否一致。
2. 检查是否触碰任务范围外文件、密钥、数据库或用户文件。
3. 对每个新增提交进行代码审查。
4. 运行完整 Python、JavaScript、FastAPI、浏览器和几何回归测试。
5. 发现问题时在 Agent 2 分支追加修复提交，不污染基准分支。
6. 全部通过后，才允许把 Agent 2 分支合并或逐提交拣选到 `feature/spatial-geometry-lab`。
7. 整合后再次运行完整测试，再走 PR、CI 和人工验收。

任何 Agent 都禁止直接把接力分支合并到 `main`。

## 13. M1 接力整合记录

- Agent 2 分支：`feature/spatial-geometry-agent2`
- 回审备份：`backup/spatial-geometry-agent2-reviewed-20260630`
- 回审备份提交：`b0f7e8c`
- 整合目标：`feature/spatial-geometry-lab`
- 回审修复：首次模型初始化、统一网格落位、122 项可复现测试、审计文档校正
- CI：四作业全绿，Node 24 官方 Action，0 条运行注解
- 当前纠偏继续点：`CUT-FIX-002 feat: 建立默认水平切面连续穿模`

M1/M2 的历史成果保留，但新开发必须遵循本次用户体验纠偏，不得继续按旧的默认裁剪方案推进。
