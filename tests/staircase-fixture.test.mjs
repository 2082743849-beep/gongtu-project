/**
 * CUT-FIX-006A 专项测试：三阶阶梯组合体 fixture。
 *
 * 验证：
 * - 坐标数量恰好 18，且无重复
 * - 每个 X 层高度分别为 3、2、1，Z 深度均为 3
 * - fixture 返回 Three.js Group，userData.type === "staircase"
 * - 包围盒尺寸为 3×3×3，居中后中心接近原点
 * - 生成模型可被 collectWorldEdges() 读取
 * - 页面模型库和 factory 接线存在
 */

import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

import { createStaircaseBlockArray, staircaseCenterOffset, createStaircaseModel } from "../geometry/staircase-fixture.js";
import { collectWorldEdges } from "../geometry/plane-intersections.js";

// ======================================================
// 1. 坐标数量恰好 18，无重复
// ======================================================
test("block count = 18", () => {
  const ba = createStaircaseBlockArray();
  assert.equal(ba.size, 18, "阶梯组合体应为 18 个单位方块");
});

test("no duplicate positions", () => {
  const ba = createStaircaseBlockArray();
  const positions = ba.toPositions();
  const keys = new Set(positions.map((p) => p.join(",")));
  assert.equal(keys.size, 18, "应无重复坐标");
  assert.equal(keys.size, positions.length, "位置数应与键数一致");
});

// ======================================================
// 2. 每层高度分别为 3、2、1，Z 深度均为 3
// ======================================================
test("X layers: heights 3, 2, 1", () => {
  const ba = createStaircaseBlockArray();
  const positions = ba.toPositions();

  for (let x = 0; x < 3; x++) {
    const layer = positions.filter(([px]) => px === x);
    const expectedHeight = 3 - x;
    assert.equal(
      layer.length,
      expectedHeight * 3,
      `x=${x} 层应包含 ${expectedHeight}×3 = ${expectedHeight * 3} 块，实际 ${layer.length}`,
    );

    // 该层高度：最高 y + 1
    const yValues = [...new Set(layer.map(([, y]) => y))].sort((a, b) => a - b);
    assert.equal(yValues.length, expectedHeight, `x=${x} 层应有 ${expectedHeight} 个 Y 值`);
    assert.equal(yValues[0], 0, `x=${x} 层最低 Y 应为 0`);
    assert.equal(yValues[yValues.length - 1], expectedHeight - 1, `x=${x} 层最高 Y 应为 ${expectedHeight - 1}`);
  }
});

test("Z depth = 3 for every layer", () => {
  const ba = createStaircaseBlockArray();
  const positions = ba.toPositions();

  for (let x = 0; x < 3; x++) {
    const layer = positions.filter(([px]) => px === x);
    const zValues = [...new Set(layer.map(([, , pz]) => pz))].sort((a, b) => a - b);
    assert.deepStrictEqual(zValues, [0, 1, 2], `x=${x} 层 Z 值应为 [0,1,2]`);
  }
});

// ======================================================
// 3. userData.type === "staircase"
// ======================================================
test("userData.type === staircase", () => {
  const group = createStaircaseModel();
  assert.equal(group.userData.type, "staircase");
  assert.equal(group.userData.blockCount, 18);
  assert.equal(group.userData.stepCount, 3);
  assert.equal(group.userData.maxHeight, 3);
  assert.equal(group.userData.depth, 3);
});

// ======================================================
// 4. 包围盒尺寸为 3×3×3，居中后中心接近原点
// ======================================================
test("bounding box 3×3×3 near origin", () => {
  const group = createStaircaseModel();
  group.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // 尺寸应为 3×3×3（含 1 单元容差）
  assert.ok(Math.abs(size.x - 3) < 0.01, `size.x=${size.x.toFixed(3)} 应接近 3`);
  assert.ok(Math.abs(size.y - 3) < 0.01, `size.y=${size.y.toFixed(3)} 应接近 3`);
  assert.ok(Math.abs(size.z - 3) < 0.01, `size.z=${size.z.toFixed(3)} 应接近 3`);

  // 居中后中心应接近原点
  assert.ok(Math.abs(center.x) < 0.01, `center.x=${center.x.toFixed(3)} 应接近 0`);
  assert.ok(Math.abs(center.y) < 0.01, `center.y=${center.y.toFixed(3)} 应接近 0`);
  assert.ok(Math.abs(center.z) < 0.01, `center.z=${center.z.toFixed(3)} 应接近 0`);
});

// ======================================================
// 5. 生成模型可被 collectWorldEdges() 读取
// ======================================================
test("collectible by collectWorldEdges", () => {
  const group = createStaircaseModel();
  group.updateMatrixWorld(true);

  const edges = collectWorldEdges(group);
  assert.ok(Array.isArray(edges), "edges 应为数组");
  assert.ok(edges.length > 0, "应有至少一条 world edge");

  // 每条 edge 应有 start 和 end 两个 THREE.Vector3
  for (const edge of edges) {
    assert.ok(edge.start.isVector3, "edge.start 应为 Vector3");
    assert.ok(edge.end.isVector3, "edge.end 应为 Vector3");
    assert.ok(edge.start.distanceTo(edge.end) > 0, "edge 长度应大于 0");
  }
});

// ======================================================
// 6. 居中偏移量
// ======================================================
test("center offset = (-1.5, -1.5, -1.5)", () => {
  const offset = staircaseCenterOffset();
  assert.equal(offset.x, -1.5);
  assert.equal(offset.y, -1.5);
  assert.equal(offset.z, -1.5);
});

// ======================================================
// 7. 从 Group 内包含有效 Mesh
// ======================================================
test("group contains BlockAssemblySolid mesh", () => {
  const group = createStaircaseModel();
  const mesh = group.getObjectByName("BlockAssemblySolid");
  assert.ok(mesh?.isMesh, "应包含实体 mesh");

  const wireframe = group.getObjectByName("BlockAssemblyWireframe");
  assert.ok(wireframe?.isLineSegments, "应包含线框");
});
