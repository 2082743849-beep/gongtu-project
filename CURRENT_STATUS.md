# 当前开发状态

更新时间：2026-07-01
当前分支：`feature/spatial-geometry-cutfix-plan`
当前里程碑：M2 截面引擎 V2 纠偏

## 当前任务

- 状态：● 已完成
- 编号：SEC2-007
- 任务：`feat: 集成截面引擎 V2 影子模式`

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

## 下一步

SEC2-008：在黄金样例和同类凹截面对比通过的前提下，把生产截面切换到 V2，并保留临时回退开关。

## 关键注意事项

- 当前页面仍显示 V1；`data-section-v2-mode="shadow"` 是未切生产的可观察证据。
- V2 遇到重叠壳体会明确报告 topology/error，不会静默显示错误截面。
- SEC2-008 才允许创建并显示 `section-visual-v2.js`，且必须保留 V1 回退路径。
- 禁止合并 `cutfix006a-experimental-do-not-merge-v1`。
