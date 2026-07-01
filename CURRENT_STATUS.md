# 当前开发状态

更新时间：2026-07-01
当前分支：`feature/spatial-geometry-cutfix-plan`
当前里程碑：M2 截面引擎 V2 纠偏

## 当前任务

- 状态：● 已完成
- 编号：SEC2-008
- 任务：`feat: 切换生产截面到 V2`

## 本次成果

- `geometry/section-engine-v2.js`
  - 遍历 Object3D 内所有实体 BufferGeometry Mesh，兼容 indexed/non-indexed 几何。
  - 将三角面顶点转换到世界坐标后，串联 SEC2-002～005 的完整计算链。
  - 输出稳定的 ok/empty/error 状态、轮廓数、三角化面积和分阶段诊断。
  - 提供 V1/V2 状态、轮廓数、面积差异的可序列化比较结果。
- `geometry.html`
  - 在旧 `updateSectionVisual()` 内增加 V2 旁路计算。
  - 只向 Canvas `data-section-v2-*` 写入比较证据。
  - V1 仍是唯一调用 `sectionVisual.update()` 的生产显示路径，未创建 V2 视觉对象。
- `tests/section-engine-v2.integration.test.mjs`
  - 覆盖世界变换、indexed/non-indexed、多个轮廓、空截面、拓扑错误和比较契约。

## 验收证据

- 聚焦测试：8/8 通过。
- `npm run test:geometry`：457/457 通过。
- `node --check geometry/section-engine-v2.js`：通过。
- `git diff --check`：通过。

## 本次成果

- 页面默认把 V2 三角化结果交给稳定 V2 视觉，并清理旧 V1 视觉。
- `?sectionEngine=v1` 强制回退；V2 明确错误或异常时自动保留 V1。
- 成功、空截面、强制回退三种路径均只允许一套截面视觉生效。
- 删除三角剖分内部对角线留下的共线轮廓点，修复过三顶点时的零面积 Earcut 三角形。
- 10 类黄金答案全部由真实三角网格端到端通过。

## 验收证据

- 聚焦测试：21/21 通过（含黄金子测试 10/10）。
- `npm run test:geometry`：470/470 通过。
- 浏览器默认入口：`sectionEngine=v2`、`sectionV2Mode=production`、无控制台错误。
- 浏览器回退入口：`?sectionEngine=v1` 得到 `forced-legacy`、无控制台错误。
- `node --check geometry/section-engine-v2.js` 与 `git diff --check`：通过。

## 下一步

SEC2-009：验证切面进入、连续穿过、离开模型时无非法空帧、残留截面或 GPU 对象增长。

## 关键注意事项

- 当前页面仍显示 V1；`data-section-v2-mode="shadow"` 是未切生产的可观察证据。
- V2 遇到重叠壳体会明确报告 topology/error，不会静默显示错误截面。
- SEC2-008 才允许创建并显示 `section-visual-v2.js`，且必须保留 V1 回退路径。
- 禁止合并 `cutfix006a-experimental-do-not-merge-v1`。
