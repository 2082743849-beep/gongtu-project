# 空间几何实验室 Agent 交接手册

更新时间：2026-06-29

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

当前功能工作树：

```text
/Users/xixi/Documents/Codex/2026-06-29/new-chat/work/gongtu-spatial
```

当前功能分支：

```text
feature/spatial-geometry-lab
```

远端跟踪分支：

```text
origin/feature/spatial-geometry-lab
```

稳定分支 `main` 禁止直接开发、提交或强推。

原项目目录曾同时进行 Windows 兼容开发，可能被另一个流程切换分支：

```text
/Users/xixi/原来的电脑文件/知识就是力量/融合版/ui尝试改进首页 - workbuddy跑
```

空间几何 Agent 不应在原项目工作树继续写代码，以免与 `feature/windows-compat` 并发互相切换 HEAD。应使用上面的独立 `gongtu-spatial` 工作树。

## 3. 产品目标不能理解错

核心不是“切完后去下面看二维结果”，而是：

1. 无限切平面和立体位于同一个 3D 场景。
2. 用户移动或倾斜切面时，模型必须同步被剖开。
3. 切口封面和截面轮廓必须在模型上实时高亮。
4. 被切掉的一侧可以隐藏、透明或稍微移开，帮助看清内部。
5. 自由练习模式允许连续移动、倾斜切面。
6. 正式题库模式由题目给出的 A、B、C 三个点唯一确定无限平面。
7. 二维截面图只能作为可选辅助，不能替代 3D 场景内实时切割。

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

接手时不得重写这些基础设施。需要调整时，先在 `TASKS.md` 建立修复或重构任务并写清理由。

## 5. 继续任务的固定流程

每次只执行 `TASKS.md` 中“下一项”：

1. 确认分支和工作区干净。
2. 将任务保持为唯一当前任务，明确交付文件和验收命令。
3. 修改不超过 3 个交付文件。
4. 必须同步修改 `TASKS.md` 和 `CURRENT_STATUS.md`。
5. 执行与风险匹配的测试。
6. 只有测试通过才能把任务改成 `- [x] ●`。
7. 提交信息必须与任务名称一致。
8. 立即推送 `origin/feature/spatial-geometry-lab`。
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
6. 当前尚未创建基础模型，场景只显示坐标网格与辅助标记是正常状态。
7. 视图栏的正视、后视、左视、右视、俯视按钮尚未接线。
8. 切割控件目前只有页面结构，真正实时切割属于 M2。

## 9. 当前继续点

新 Agent 必须以 `TASKS.md` 为准。写下本文件时，计划中的下一项产品任务是：

```text
LAB-006 feat: 建立长方体与正方体生成器
```

如果看板已经推进到更后的任务，禁止退回本处重复实现。

## 10. 禁止事项

- 禁止直接修改或提交 `main`。
- 禁止在原项目工作树和独立功能工作树之间来回切换同一分支。
- 禁止清理、覆盖或提交不属于当前任务的用户文件。
- 禁止让 AI 直接输出并执行 JavaScript 模型代码。
- 禁止把视觉裁剪当成真实截面计算。
- 禁止任务未验收就打勾。
- 禁止只在聊天中报告完成而不真实修改 `TASKS.md`。
- 禁止一次完成多个看板任务后只做一个大提交。
