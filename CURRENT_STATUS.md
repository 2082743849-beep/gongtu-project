# 当前开发状态

更新时间：2026-07-01
当前分支：`feature/spatial-geometry-cutfix-plan`
基准标签：`section-engine-v2-sec2-004-handoff-v1`
当前里程碑：M2 截面引擎 V2 纠偏

## 当前任务

- 状态：● 已完成
- 编号：SEC2-005
- 任务：`feat: 建立截面轮廓拓扑与三角化`

## 本次成果

- `geometry/section-contour-topology.js`：二维投影 + 外环/孔洞拓扑
  - 确定性正交基选择（选法向量最不平行世界轴 × 法向量，u×v=n）
  - 鞋带有符号面积判断 CCW/CW，外环强制 CCW，孔洞强制 CW
  - 使用环上确定顶点做包含测试，depth 偶数 = outer，奇数 = hole
  - 洞中岛（depth 2）成为独立 polygon group
  - 环自交/相交/相触、degenerate 零面积、离面点均明确拒绝
- `geometry/section-triangulation.js`：ShapeUtils.triangulateShape（内部 Earcut）
  - 使用 Vector2[] 输入，[[i0,i1,i2]] 输出，展平为全局索引
  - 外环顶点先于孔洞展平，本地索引 + vertexStart 映射
  - 面积极守恒、退化三角形、索引范围三重验证
- `tests/section-triangulation.test.mjs`：29 项测试

## 验收证据

- 聚焦测试 `--test tests/section-triangulation.test.mjs`：**29/29 通过**
- 全量 `npm run test:geometry`：**440/440 通过**（411 基线 + 29 新增）
- `node --check`：全部 3 个文件通过
- `git diff --check`：通过

## 关键设计决策

- 二维基选择：和法向量最不平行的世界轴 × n → u，n × u → v（确定性）
- 洞中岛成为独立 polygon group，holes2D = []，由三角化单独处理
- 环相触/相交在拓扑阶段立即拒绝，不交由 Earcut 静默消化
- 环相交与相触先于父子归属被拒绝
- 主协调回审修复：凹环顶点平均值可能落在凹口外，改用环上确定顶点判断包含
- 主协调回审修复：线段相交分别比较方向符号与 epsilon，避免错误比较乘积尺度

## 尚未解决的数学边界

- 整个三角面共面时 SEC2-002 不输出任意边（SEC2-002 契约）
- 网格级共面面策略仍待后续集成明确
- 生产页面仍使用旧截面路径，V2 尚未集成

## 下一步

SEC2-006：建立稳定的多轮廓截面视觉。需复用 BufferGeometry、避免每帧 dispose/new，实现脏标记和空截面不闪烁。

## 声明

- ✅ 已由主协调 Agent 回审并整合到稳定功能分支
- ✅ 未开始 SEC2-006
- ✅ 未修改生产页面
- ✅ 未使用质心极角排序
- ✅ 未重新链接线段或重新聚类端点
- ✅ 未合并 `cutfix006a-experimental-do-not-merge-v1`
- ✅ 临时 node_modules 符号链接已清理
