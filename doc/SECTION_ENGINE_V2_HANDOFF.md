# 截面引擎 V2 接力手册：SEC2-004 起点

> 冻结日期：2026-07-01
> 冻结标签：`section-engine-v2-sec2-003-handoff-v1`
> 稳定分支：`feature/spatial-geometry-cutfix-plan`
> 下一任务：`SEC2-004 feat: 将截面线段链接为闭合轮廓`

## 1. 给下一位 Agent 的最短指令

从冻结标签建立隔离分支与 worktree，只做 SEC2-004。不要改页面、三角化或生产路径，
完成测试后停下等待主协调 Agent 回审。

```bash
cd /Users/xixi/Documents/Codex/2026-06-29/new-chat/work/gongtu-cutfix-plan
git fetch --tags origin
git status --short --branch
git rev-list -n 1 section-engine-v2-sec2-003-handoff-v1
git log -6 --oneline --decorate
```

修改前必须完整阅读：

1. `.ai_rules.md`
2. `TASKS.md`
3. `CURRENT_STATUS.md`
4. `doc/SECTION_ENGINE_V2_PLAN.md`
5. 本文件
6. `geometry/triangle-plane-slice.js`
7. `geometry/section-segment-normalizer.js`
8. `tests/section-segment-normalizer.test.mjs`

若 Git 事实与文档不一致，停止修改并先报告。禁止 `git reset --hard`。

## 2. 已冻结的根因与路线

旧算法把模型外棱与平面的交点变成无序点集，再围绕质心极角排序。这个过程已经丢失边连接关系，
所以 L 形和阶梯形凹口会被跨接。Earcut 不能恢复已经丢失的拓扑。

唯一允许的 V2 路线：

```text
三角面切片（SEC2-002 已完成）
  → 线段归一化（SEC2-003 已完成）
  → 邻接图链接一个或多个闭环（SEC2-004 下一项）
  → 外环/孔洞拓扑与三角化（SEC2-005）
  → 稳定视觉（SEC2-006）
  → 影子比较、切换与连续性验收（SEC2-007～009）
```

失败实验 `cutfix006a-experimental-do-not-merge-v1` 只能分析，禁止合并。

## 3. 当前完成进度

| 项目 | 状态 | 证据 |
|---|---|---|
| SEC2-000 规划与根因冻结 | 完成 | `section-engine-v2-plan-v1` |
| SEC2-001 黄金答案 | 完成 | 10 个独立样例；专项 6/6 |
| SEC2-002 单三角面切片 | 完成 | 专项 9/9 |
| SEC2-003 线段归一化 | 完成 | 专项 10/10；整库 385/385 |
| UX2-001 页面滚轮修复 | 完成 | 专项 2/2 |
| SEC2-004 邻接闭环 | 下一项 | 尚未开始 |
| SEC2-005～009 | 等待依赖 | 必须串行 |

现在已经完成“正确答案 → 三角面交线 → 干净线段集合”三层基础。SEC2-004 是第一次恢复旧算法丢失的连接关系。

## 4. SEC2-002 与 SEC2-003 接口契约

SEC2-002：

```js
const result = sliceTriangleWithPlane(triangle, plane, {
  triangleId,
  epsilon,
});
```

只有 `result.segment` 非空时才能进入 SEC2-003。`point` 和整个共面三角面不是线段。

SEC2-003：

```js
const normalized = normalizeSectionSegments(segments, { epsilon });
```

输出：

```js
{
  segments: [
    {
      start: THREE.Vector3,
      end: THREE.Vector3,
      triangleIds: [/* 稳定去重后的来源 */],
    },
  ],
  epsilon,
  removed: {
    zeroLength,
    duplicates,
  },
}
```

关键保证：

- 每条线段端点按 x/y/z 字典序排列。
- 线段数组稳定排序，不依赖输入顺序。
- epsilon 内端点已映射到同一个 Vector3 坐标代表。
- 零长、完全重复与反向重复线段已删除。
- 重复边来源聚合在 `triangleIds`，不能丢失。
- 端点簇使用 epsilon 邻接的传递闭包；SEC2-004 不得再次聚类或改坐标。

## 5. SEC2-004 的严格施工边界

允许的交付文件只有：

```text
geometry/section-contour-builder.js
tests/section-contour-builder.test.mjs
```

`TASKS.md`、`CURRENT_STATUS.md` 是强制审计文件，不计入交付文件上限。

输入是 SEC2-003 的 `normalized.segments`。目标是利用端点邻接图输出：

```js
{
  status: "ok",
  contours: [
    {
      points: [/* 不重复尾点的闭环顶点 */],
      segmentCount,
      triangleIds,
    },
  ],
}
```

具体字段可在实现时小幅调整，但必须满足：

1. 每个端点作为图节点，每条规范线段作为无向边。
2. 合法闭环中每个节点度数必须为 2。
3. 支持一个 L 形凹环。
4. 支持阶梯折线环，不能跨越凹口。
5. 支持多个不相连闭环，输出多个 contour。
6. 输出顺序与每个环的起点、方向必须确定，不受输入线段顺序和方向影响。
7. 开链、分叉、孤立错误和非流形输入必须返回明确错误状态，不能猜轮廓。
8. 所有输入边必须恰好消费一次；不能遗漏或重复走边。
9. 来源 `triangleIds` 必须稳定聚合到对应轮廓。

## 6. 确定性建议

建议先建立“坐标键 → 节点”与邻接边表，并在遍历前排序：

- 每个闭环选择字典序最小节点为起点。
- 从起点的两个邻居中选择能形成统一方向的路径；可先生成正向与反向两个候选序列，
  再选择字典序较小的完整序列。
- 最终 contours 按其规范化点序列排序。

不要使用质心极角排序。SEC2-004 的价值恰恰是沿真实边邻接关系走环。

## 7. 明确禁止

- 不做外环/孔洞分类；属于 SEC2-005。
- 不计算面积和凹性作为走环依据。
- 不调用 Earcut。
- 不投影到切面二维坐标。
- 不读取 DOM，不修改 `geometry.html`。
- 不修改 Three.js 场景、截面视觉或旧 V1。
- 不接入生产路径。
- 不开始 SEC2-005，即使测试全绿也必须先回审。
- 不合并任何失败实验分支。

## 8. 最低测试矩阵

- 正方形线段顺序打乱、方向混合，输出一个稳定闭环。
- L 形凹轮廓保持正确的 6 个顶点和凹口连接。
- 三阶阶梯折线顺序正确。
- 两个互不相连区域输出两个 contour。
- 输入数组反转后输出完全相同。
- 开链返回明确错误。
- T 形分叉节点返回明确错误。
- 节点度数大于 2 的非流形输入返回明确错误。
- 空输入返回明确且稳定的空结果。
- 非 Vector3、重复边漏过归一化等非法输入明确拒绝。
- 每条边只消费一次，来源 ID 聚合正确。

测试期望必须手写，不得调用旧极角排序或生产截面算法生成答案。

## 9. 验收命令

根目录 `node_modules` 不提交。缺失时从临时 `npm ci` 目录创建符号链接，测试后删除。

```bash
node --experimental-loader ./tests/three-absolute-loader.mjs \
  --test tests/section-contour-builder.test.mjs
node --check geometry/section-contour-builder.js
npm run test:geometry
git diff --check
git status --short --branch
```

只有聚焦测试、全量测试和 diff 检查全部通过，SEC2-004 才能标记完成。

## 10. 已知风险

- 端点 epsilon 聚类已在 SEC2-003 完成；重复聚类会破坏图节点身份。
- 单纯“每节点度 2”不足以识别外环与孔洞，但足以链接闭环；拓扑分类留给 SEC2-005。
- 整个三角面共面目前没有输出任意边，网格级共面面策略仍待后续集成明确。
- 生产页面继续使用旧路径，当前凹截面画面不能证明 V2 正确。
- UX2-001 尚缺真实浏览器滚轮、拖拽和按钮手势截图验收。
- `cutfix006a-v1-staircase-done` 不得整体合并；最多在 SEC2-007 经审查选择性复用入口。

## 11. 下一位 Agent 的返回格式

- 基线标签、隔离分支、最终提交。
- 修改文件，最多两个交付文件加审计文件。
- 聚焦与全量测试命令、通过数和失败数。
- 图节点键、闭环规范化和确定性策略。
- 开链、分叉、非流形错误契约。
- 来源 ID 聚合证据。
- 尚未解决的数学边界。
- 明确声明：未合并、未开始 SEC2-005、未修改生产页面。

完成后停下等待回审。
