# 当前开发状态

更新时间：2026-06-30
当前分支：`feature/spatial-geometry-cutfix-plan`
当前里程碑：M2 实时截面教学体验纠偏

## 当前任务

- 状态：● 已完成
- 编号：CUT-FIX-001
- 任务：`docs: 重定义实时截面教学体验`

## 刚刚完成了什么

1. 根据用户提供的 42 秒参考视频纠正默认产品体验。
2. 默认模式改为保留完整或半透明模型，只高亮切面与模型真实相交得到的蓝色截面。
3. 巨大红色刀面不再是验收目标；真实剖开改为用户主动开启的辅助模式。
4. 暂停 COM-007，建立 CUT-FIX-002 至 CUT-FIX-007 的依赖链和视频验收门禁。

## 本任务修改文件

- `doc/AGENT_HANDOFF.md`
- `TASKS.md`
- `CURRENT_STATUS.md`

## 验收记录

- 已检查：`TASKS.md` 只有一个产品继续点，下一项为 CUT-FIX-002。
- 已检查：M2 标记为体验纠偏中，M3 与 COM-007 明确暂停。
- 已检查：旧 CUT 任务保留算法完成事实，但不再代表用户视觉验收通过。
- 已检查：交接文档记录参考视频、正确默认模式、辅助模式和脏工作区保护要求。
- 待执行：提交并推送本独立规划分支。

## 下一步

执行 CUT-FIX-002：`feat: 建立默认水平切面连续穿模`。开始业务代码前必须先保护并审查
`feature/spatial-geometry-cut011-agent` 上 Mavis 尚未提交的 COM-006 修改。

## 已知问题

1. 当前默认隐藏或裁掉模型的一侧，偏离用户要求的教学模式。
2. 视觉切割平面过大、过亮，遮挡模型和真实截面。
3. 默认切面方向和移动轴不符合“从模型顶部连续向下穿过”的第一体验。
4. `feature/spatial-geometry-cut011-agent` 当前领先远端 1 个未验收提交，并有未提交的
   `geometry.html`、`geometry/view-controller.js`、`tests/view-controller.test.mjs` 以及未跟踪
   `csg-verify.html`；任何 Agent 均不得清理、覆盖或顺带提交这些文件。
5. 现有几何算法测试通过不等于参考视频所示的连续视觉体验已经通过。

## 提交与远端

- 提交：本文件所在提交，信息为 `docs: 重定义实时截面教学体验`
- 推送目标：`origin/feature/spatial-geometry-cutfix-plan`
