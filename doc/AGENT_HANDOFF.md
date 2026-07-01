# 空间几何实验室 Agent 交接手册

更新时间：2026-07-01

权威分支：`feature/spatial-geometry-cutfix-plan`

禁止合并：`cutfix006a-experimental-do-not-merge-v1`

## 1. 接手后的固定顺序

先读 `.ai_rules.md`、`TASKS.md`、`CURRENT_STATUS.md`、`doc/GEOMETRY_ARCHITECTURE.md`
和本文件，再执行：

```bash
git status --short --branch
git branch --show-current
git log -5 --oneline --decorate
git diff
```

唯一正确工作树：

```text
/Users/xixi/Documents/Codex/2026-06-29/new-chat/work/gongtu-cutfix-plan
```

若 Git 与文档冲突，以 Git 和 `TASKS.md` 为准。禁止 `reset --hard`，禁止直接修改 `main`。
每项任务最多 3 个交付文件，另同步 `TASKS.md`、`CURRENT_STATUS.md`，单独提交并推送。

## 2. 当前冻结状态

截面引擎 V2 的 SEC2-001～009 已依序完成。关键冻结点：

| 冻结标签 | 内容 |
|---|---|
| `section-engine-v2-plan-v1` | 原始施工图，提交 `b93ca9d` |
| `section-engine-v2-sec2-007-handoff-v1` | V1/V2 影子比较，提交 `ca351cb` |
| `section-engine-v2-sec2-008-handoff-v1` | V2 切换生产，提交 `4e18190` |
| `section-engine-v2-sec2-009-handoff-v1` | 连续性终验，以 Git 标签为准 |

生产页面默认使用 V2。临时回退入口：

```text
/geometry?sectionEngine=v1
```

回退只用于事故定位，不得删除 V2 或把 V1 重新设为默认。

## 3. 算法必须这样理解

旧算法“模型外棱交点 → 质心极角排序”丢失边连接关系，只对凸截面可靠。V2 的固定链路是：

```text
模型三角面（世界坐标）
  → triangle-plane slice
  → 近似端点聚类、零长/重复线段清理
  → 度数为 2 的邻接图
  → 一个或多个闭合轮廓
  → 删除三角面内部对角线产生的共线中间点
  → 共享切面二维基
  → 外环/孔洞/洞中岛拓扑
  → Earcut 三角化与面积守恒检查
  → 复用 BufferGeometry 的蓝色填充和闭合轮廓
```

各节点契约：

1. `triangle-plane-slice.js`：单三角面只返回 0/1 条线段；点接触和整面共面不伪造线段。
2. `section-segment-normalizer.js`：只聚类、去零长、去重复；不连接轮廓。
3. `section-contour-builder.js`：节点度数必须为 2；开链、分叉、非流形明确报错，不猜答案。
4. `section-engine-v2.js`：遍历 indexed/non-indexed Mesh，应用 `matrixWorld`，串联全链并输出
   `ok/empty/error`、轮廓数、面积和诊断。
5. `section-contour-topology.js`：全部轮廓共用同一二维基；父环使用环上顶点判包含，不能使用凹环
   的顶点平均值。
6. `section-triangulation.js`：Earcut 只负责正确边界的三角化；必须校验索引、退化三角形和面积守恒。
7. `section-visual-v2.js`：输入先完整验证；BufferGeometry 长期复用；相同数据跳过写入；空截面清零并隐藏。

绝对禁止重新引入质心极角排序、把多个轮廓强接成一个环、或让 Earcut 猜拓扑。

## 4. 生产接线与可观察状态

页面入口是 `geometry.html`，生产更新仍集中在 `updateSectionVisual()`。

- 默认：V2 成功或空截面时使用 V2，并清理 V1 视觉。
- 强制回退：查询参数 `sectionEngine=v1`。
- 自动回退：V2 返回 `error` 或抛异常时保留 V1，并清理 V2。
- 两套视觉不得同时显示。

Canvas 上的重要证据：

```text
data-section-engine="v2|v1"
data-section-engine-reason="production|forced-legacy|v2-error|v2-exception"
data-section-v2-mode="production|fallback"
data-section-v2-status="ok|empty|error"
data-section-v2-contour-count
data-section-v2-area
data-section-v2-error
```

## 5. 已验证范围

- 10 类真实三角网格黄金样例：正方体水平/斜切、16 边圆柱、18 方块三阶阶梯、L 形、
  折线凹棱柱、两个分离长方体、顶点相切、过三个顶点、共面顶面。
- 连续序列：正方体水平扫面、正方体斜扫、阶梯跨整数共面边界。
- 生命周期：进入模型显示、模型内无非法空帧、离开后 fill/outline drawRange 均为 0。
- GPU 稳定性：Mesh/LineSegments 的 BufferGeometry 身份不变，扩容受控，相同帧不重复写 attribute。
- 浏览器：默认入口为 V2 production；`?sectionEngine=v1` 为 forced-legacy；两者无控制台错误。

常用测试：

```bash
node --experimental-loader ./tests/three-absolute-loader.mjs \
  --test tests/section-engine-v2.integration.test.mjs
node --experimental-loader ./tests/three-absolute-loader.mjs \
  --test tests/section-engine-v2-continuity.test.mjs
npm run test:geometry
git diff --check
```

## 6. 后续任务难度与建议顺序

| 后续任务 | 难度 | 原因与边界 |
|---|---:|---|
| UX2-002 压缩首屏布局 | 低 | 主要是 CSS/布局；不得改算法和 3D 状态 |
| UX2-003 视角与切面拖拽模式 | 高 | OrbitControls 与切面拖拽会争抢指针；必须先写明确状态机 |
| CUT-FIX-007 参考视频体验验收 | 中 | 算法已稳定，重点是连续操作、构图和录屏证据 |
| 关闭旧 CUT-FIX-006 阻塞项 | 低 | 只核对 V2 证据并更新看板，不再写第二套算法 |
| COM-007 恢复组合体验收 | 中高 | 需验证分层配色产生的多 Mesh 接缝；不能假设所有组合都是单壳体 |
| 5×5×5 分层搭建器 | 中高 | 数据/UI 工作量大，但应复用现有 BlockArray/BlockAssembly/V2 |
| 任意重叠壳体布尔并集截面 | 很高 | 当前重叠封闭壳体会明确报 topology error；若要支持，应先做可靠并集表面 |
| 洞、内腔与复杂 CSG 回归 | 高 | 拓扑已支持孔洞，但真实 CSG 网格质量和共面碎片需要独立黄金样例 |

建议先做 UX2-002，再做 UX2-003，随后录制 CUT-FIX-007；不要立刻扩张到任意 CSG。

## 7. 已知边界

- 相互重叠但未布尔合并的多个封闭 Mesh 会形成相交轮廓，V2 会返回 topology/error 并自动回退 V1。
- `BlockAssembly` 的统一配色模式会生成外表面网格，已通过阶梯测试；分层配色会拆成多个 Mesh，
  必须在 COM-007 单独验证接缝。
- V2 已能显示多轮廓；旧二维辅助图和详细顶点列表仍偏向单轮廓表达，后续若扩展 UI 必须单独建任务。
- 自动测试不能替代最终参考视频的人工体验验收。
- Electron 依赖打包尚未在本轮验证。

## 8. 禁止事项

- 禁止合并 `cutfix006a-experimental-do-not-merge-v1`。
- 禁止删除 V1 临时回退，除非另有任务、完整回归和用户批准。
- 禁止用截图通过代替几何测试，也禁止只用单测通过代替参考视频体验验收。
- 禁止默认隐藏模型一侧；真实剖开只能由用户主动开启。
- 禁止在没有任务编号时改业务代码，或把多个任务压成一个提交。
