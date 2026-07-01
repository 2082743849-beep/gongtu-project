# 当前开发状态

更新时间：2026-07-01
当前分支：`feature/spatial-geometry-cutfix-plan`
当前里程碑：M2 截面引擎 V2 纠偏

## 当前任务

- 状态：● 已完成
- 编号：UX2-003
- 任务：`feat: 建立视角与切面拖拽模式`

## 本次成果

- `tests/section-engine-v2-continuity.test.mjs`
  - 正方体水平进入、穿过、离开状态序列无非法空帧。
  - 正方体斜切严格内部全部保持有效面积截面。
  - 18 方块阶梯跨 z=0/1/2/3 共面边界保持 8 顶点、面积 6。
  - 生产视觉 BufferGeometry 身份固定，离开后 fill/outline drawRange 归零。
  - 相同帧不重复更新 GPU attribute。
- `doc/AGENT_HANDOFF.md`
  - 固定 V2 全链算法、模块契约、生产回退、冻结标签、已知边界和禁止事项。
  - 标明后续任务难度与建议顺序。
- `doc/SECTION_ENGINE_V2_PLAN.md`
  - 更新为 SEC2-001～009 已完成状态。
  - 补充完成后的任务顺序和扩展风险。

## 最终验收证据

- SEC2-008 真实三角网格黄金样例：10/10 通过。
- SEC2-009 连续性专项：5/5 通过。
- 全量 `npm run test:geometry`：475/475 通过。
- 浏览器默认入口：`sectionEngine=v2`、`sectionV2Mode=production`、无控制台错误。
- 浏览器回退入口：`?sectionEngine=v1` 得到 `forced-legacy`、无控制台错误。
- `node --check geometry/section-engine-v2.js` 与 `git diff --check`：通过。

## 本次成果

- 桌面宽屏压缩页头、工作区间距、模型列表和控件留白。
- 工作区固定在 `100dvh - 56px`，中央 3D 画布使用剩余高度。
- 左右面板在桌面首屏内独立滚动，页面本身不产生纵向滚动。
- 1080px 以下恢复自然文档流，760×800 页面可正常滚动。
- 新增 `tests/ux2-layout.test.mjs` 三项布局契约。

## 验收证据

- 专项：3/3 通过。
- 全量：478/478 通过。
- 1280×720：document scrollHeight=720；画布 682×524；切面控制标题和实时截面状态首屏可见。
- 760×800：document scrollHeight=2441，窄屏自然滚动。
- 浏览器无控制台错误；`git diff --check` 通过。

## 本次成果

- `geometry/viewport-interaction-mode.js`
  - 只允许 `orbit` / `plane` 两个互斥模式。
  - 单活动 pointerId；切回 orbit 自动取消拖拽。
  - 输出按画布高度归一化的纵向拖动距离。
- `geometry.html`
  - 新增“旋转视角 / 拖动切面”显式按钮。
  - plane 模式禁用 OrbitControls；orbit 模式恢复。
  - pointer capture 保证拖拽生命周期完整；三点锁定时拒绝拖动覆盖。
  - Canvas 记录 mode、dragging、orbitEnabled。
- `tests/viewport-interaction-mode.test.mjs`：状态转换、单 pointer、取消、非法输入和页面接线。

## 验收证据

- 专项：5/5 通过。
- 全量：483/483 通过。
- plane 手势：offset `-0.50 → -1.19`，camera 不变。
- orbit 手势：camera 明显变化，offset 保持 `-1.19`。
- locked + plane：camera 和 offset 均不变。
- `node --check` 与 `git diff --check`：通过。

## 下一步

UX2-004：只更新最终交接和冻结点，不再修改业务代码。

## 关键注意事项

- 当前页面默认显示 V2；查询参数 `?sectionEngine=v1` 是临时回退。
- V2 遇到未布尔合并的重叠壳体会明确报告 topology/error 并自动回退。
- 旧二维辅助图和详细顶点列表仍偏向单轮廓表达，扩展时必须另建任务。
- 禁止合并 `cutfix006a-experimental-do-not-merge-v1`。
