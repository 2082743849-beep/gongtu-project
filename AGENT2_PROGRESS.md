# Agent 2 专属进度板

> 本文件只记录 Agent 2 在 `feature/spatial-geometry-agent2` 分支上的工作。
> 不影响基准分支 `feature/spatial-geometry-lab` 上的 TASKS.md。
> Agent 1 回来后通过 `git diff` 审查差异。

## 当前状态

- 分支：`feature/spatial-geometry-agent2`
- 基线：`23c76df`（GOV-005C）
- 进度：7/7（M1 基础模型生成器）✅ 全部完成

## M1 基础模型生成器（Agent 2 接力部分）

- [x] ● LAB-006 feat: 建立长方体与正方体生成器
  - 提交：`54a7e9f`
  - 验收：语法检查通过；createBox/createCube 返回 Group(实体+棱线)；按钮与滑块联动；参数安全降级

- [x] ● LAB-007 feat: 建立三棱柱生成器
  - 提交：`df84f29`
  - 验收：ExtrudeGeometry 正三角形拉伸；浏览器截图验证三棱柱实体面渲染正常

- [x] ● LAB-008 feat: 建立三棱锥生成器
  - 提交：`b5d770d`
  - 验收：ConeGeometry(radialSegments=3) 生成三棱锥；浏览器截图验证正常

- [x] ● LAB-009 feat: 建立圆柱生成器
  - 提交：`4f2f18b`
  - 验收：CylinderGeometry 五参数签名；浏览器截图验证圆柱实体面+棱线正常

- [x] ● LAB-010 feat: 建立圆锥与球体生成器
  - 提交：`29c42e9`
  - 验收：ConeGeometry + SphereGeometry；浏览器分别截图验证两个模型渲染正常

- [x] ● LAB-011 feat: 建立基础模型参数控制面板
  - 提交：`7f5b694`
  - 验收：动态参数控件（7种模型各自专属参数）、颜色选择器、100ms debounce 实时重建；浏览器截图验证

- [x] ● LAB-012 test: 验证基础模型参数和退化输入
  - 提交：`beda165`
  - 验收：183 个测试用例全部通过；所有参数安全降级到 ≥0.01，无崩溃路径

## 禁止事项

- 禁止修改 `feature/spatial-geometry-lab`
- 禁止修改 `backup/spatial-geometry-checkpoint-20260629`
- 禁止合并回基准分支
- 每次只能做一个任务，做完立即提交推送

## 防失忆检查点

Agent 2 每次开始新任务前必须：
1. `git status --short --branch` 确认分支和干净工作区
2. 读本文件确认下一任务
3. 读 `doc/AGENT_HANDOFF.md` 第 2 节核对环境
