# 当前开发状态

更新时间：2026-06-29
当前分支：`feature/spatial-geometry-lab`
当前里程碑：M0 工程治理与现状保护

## 当前任务

- 状态：● 已完成
- 编号：GOV-004
- 任务：`chore: 建立空间几何依赖锁定方案`

## 刚刚完成了什么

1. 建立根目录前端依赖清单，与 `desktop/package.json` 的 Electron 依赖分离。
2. 精确锁定 `three@0.185.0`、`three-mesh-bvh@0.9.10` 和 `three-bvh-csg@0.0.18`。
3. 规定 Node.js 20 及以上版本，并记录当前 npm 包管理器版本。
4. 增加 `npm run deps:check` 依赖树检查命令。

## 本任务修改文件

- `package.json`
- `TASKS.md`
- `CURRENT_STATUS.md`

## 验收记录

- 已通过：在隔离临时目录实际安装 3 个包，安装过程无错误。
- 已通过：`npm run deps:check` 显示依赖树完整，peer dependency 均满足。
- 已通过：三个核心依赖均为精确版本，不使用 `^` 或 `~`。
- 已通过：`git diff --check` 无错误，工作区只有三个指定文件发生变化。
- 提交与推送将在本文件验收完成后立即执行。

## 下一步

执行 GOV-004A：`chore: 生成可复现依赖锁文件`。

## 已知风险与保护措施

- `three-bvh-csg` 官方仍标记为实验性依赖，不能作为截面数学正确性的唯一来源。
- CSG 要求输入网格封闭且无三角形自交；后续必须增加输入校验和退化测试。
- 本任务精确锁定清单版本；可复现的完整传递依赖锁文件将在不突破三文件任务限制的独立任务中建立。

## 提交与远端

- 提交：本文件所在提交，信息为 `chore: 建立空间几何依赖锁定方案`
- 推送：提交后立即推送至 `origin/feature/spatial-geometry-lab`
