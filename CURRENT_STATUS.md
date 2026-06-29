# 当前开发状态

更新时间：2026-06-29
当前分支：`feature/spatial-geometry-lab`
当前里程碑：M0 工程治理与现状保护

## 当前任务

- 状态：● 已完成
- 编号：GOV-002
- 任务：`docs: 同步项目开发规范的规则优先级`

## 刚刚完成了什么

1. 将旧文档从“开发宪法”调整为“通用开发规范”，避免出现两个最高规则。
2. 在旧规范顶部加入 `.ai_rules.md`、`TASKS.md` 和 `CURRENT_STATUS.md` 的明确入口。
3. 固化“用户当前指令 → `.ai_rules.md` → `PROJECT_RULES.md` → 其他文档”的优先级。
4. 规定新需求必须先更新规则和任务看板，再修改业务代码。

## 本任务修改文件

- `doc/PROJECT_RULES.md`
- `TASKS.md`
- `CURRENT_STATUS.md`

## 验收记录

- 已通过：旧规范已链接 `.ai_rules.md`、`TASKS.md` 和 `CURRENT_STATUS.md`。
- 已通过：四级规则优先级表达完整且没有相互冲突。
- 已通过：`git diff --check` 未发现空白错误。
- 已通过：`git diff --name-only` 显示本任务只修改三个指定文件。
- 提交与推送将在本文件验收完成后立即执行。

## 下一步

执行 GOV-003：`docs: 编写空间几何模块架构决策`。

## 已知风险与保护措施

- 旧规范中的 Git 流程继续有效，但 AI 的细粒度任务与状态要求由 `.ai_rules.md` 补充。
- 本任务只调整规则关系，不改变现有业务代码、CI 或分支历史。

## 提交与远端

- 提交：本文件所在提交，信息为 `docs: 同步项目开发规范的规则优先级`
- 推送：提交后立即推送至 `origin/feature/spatial-geometry-lab`
