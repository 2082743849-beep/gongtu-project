/**
 * 截面多边形排序包装层
 *
 * 透传 plane-intersections.js 中除 orderAndCloseSection 外的全部导出，
 * 将 orderAndCloseSection 替换为支持凹形截面的增强版。
 *
 * 不修改冻结文件 plane-intersections.js。
 */

import * as THREE from "three";

import {
  collectWorldEdges,
  intersectEdgesWithPlane,
  orderAndCloseSection as _originalOrder,
} from "./plane-intersections.js";

// 透传未改动的导出
export { collectWorldEdges, intersectEdgesWithPlane };

// ---------------------------------------------------------------------------
// 凹形多边形排序 —— 可见性追踪法
// ---------------------------------------------------------------------------

function polygonBasis(normal) {
  const reference =
    Math.abs(normal.z) < 0.9
      ? new THREE.Vector3(0, 0, 1)
      : new THREE.Vector3(0, 1, 0);
  const u = reference.clone().cross(normal).normalize();
  const v = normal.clone().cross(u).normalize();
  return { u, v };
}

function signedProjectedArea(points, u, v) {
  let twiceArea = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    twiceArea += a.dot(u) * b.dot(v) - b.dot(u) * a.dot(v);
  }
  return twiceArea / 2;
}

function orient2D(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment2D(a, b, c, eps) {
  return (
    Math.min(a.x, b.x) - eps <= c.x &&
    c.x <= Math.max(a.x, b.x) + eps &&
    Math.min(a.y, b.y) - eps <= c.y &&
    c.y <= Math.max(a.y, b.y) + eps
  );
}

function segmentsCross2D(p1, p2, p3, p4, eps) {
  const o1 = orient2D(p1, p2, p3);
  const o2 = orient2D(p1, p2, p4);
  const o3 = orient2D(p3, p4, p1);
  const o4 = orient2D(p3, p4, p2);
  if (o1 === 0 && onSegment2D(p1, p2, p3, eps)) return true;
  if (o2 === 0 && onSegment2D(p1, p2, p4, eps)) return true;
  if (o3 === 0 && onSegment2D(p3, p4, p1, eps)) return true;
  if (o4 === 0 && onSegment2D(p3, p4, p2, eps)) return true;
  return o1 > 0 !== o2 > 0 && o3 > 0 !== o4 > 0;
}

/**
 * 可见性追踪法排序凹形多边形顶点
 *
 * 从最左下角出发，每步选择「最左转且不与已有边相交」的顶点，
 * 保证凹形截面（L形、Z形、阶梯形）正确闭合不产生自交。
 */
function traceConcavePolygon(pts2d, eps) {
  const n = pts2d.length;
  if (n < 3) throw new Error("need >= 3 points");

  // 找最左下角作为起点
  let startIdx = 0;
  for (let i = 1; i < n; i++) {
    const a = pts2d[startIdx];
    const b = pts2d[i];
    if (b.y < a.y - eps || (Math.abs(b.y - a.y) <= eps && b.x < a.x - eps)) {
      startIdx = i;
    }
  }

  const visited = new Set([startIdx]);
  const order = [startIdx];
  let prevDir = { x: 1, y: 0 };

  while (order.length < n) {
    const currIdx = order[order.length - 1];
    const curr = pts2d[currIdx];
    let bestIdx = -1;
    let bestTurn = Infinity;

    for (let i = 0; i < n; i++) {
      if (visited.has(i)) continue;
      const cand = pts2d[i];
      const dx = cand.x - curr.x;
      const dy = cand.y - curr.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq < eps * eps) continue;

      const cross = prevDir.x * dy - prevDir.y * dx;
      const dot = prevDir.x * dx + prevDir.y * dy;
      const turn = Math.atan2(cross, dot);

      // 不穿过已有边
      let crosses = false;
      for (let j = 0; j < order.length - 1; j++) {
        if (segmentsCross2D(curr, cand, pts2d[order[j]], pts2d[order[j + 1]], eps)) {
          crosses = true;
          break;
        }
      }
      if (crosses) continue;

      if (turn < bestTurn - eps) {
        bestTurn = turn;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) {
      // 回退：选最近未访问点
      let minDist = Infinity;
      for (let i = 0; i < n; i++) {
        if (visited.has(i)) continue;
        const c = pts2d[i];
        const d = (c.x - curr.x) ** 2 + (c.y - curr.y) ** 2;
        if (d < minDist) {
          minDist = d;
          bestIdx = i;
        }
      }
      if (bestIdx === -1) break;
    }

    const chosen = pts2d[bestIdx];
    prevDir = { x: chosen.x - curr.x, y: chosen.y - curr.y };
    visited.add(bestIdx);
    order.push(bestIdx);
  }

  return order.map((i) => ({ x: pts2d[i].x, y: pts2d[i].y }));
}

/**
 * 平面交点排序并闭合为多边形（增强版）
 *
 * 先用原始角度排序得到一个候选，再在 2D 投影空间用可见性追踪重排。
 * 若追踪结果面积不小于原始结果（排除退化），采用追踪结果；
 * 否则回退到原始排序——保证凸形不受影响。
 */
export function orderAndCloseSection(points, plane, { epsilon } = {}) {
  // 先用原始算法得到完整结果（保证接口兼容）
  const result = _originalOrder(points, plane, { epsilon });

  if (result.status !== "polygon" || result.points.length < 4) {
    return result; // 退化或三角形不需要重排
  }

  const { u, v } = result.basis;
  const pts3D = result.points;

  // 投影到 2D
  const pts2D = pts3D.map((p) => ({ x: p.dot(u), y: p.dot(v) }));

  try {
    const traced = traceConcavePolygon(pts2D, result.epsilon);

    // 把 2D 顺序映射回 3D 点
    const traced3D = traced.map((t) => {
      const found = pts3D.find(
        (p) =>
          Math.abs(p.dot(u) - t.x) < result.epsilon * 2 &&
          Math.abs(p.dot(v) - t.y) < result.epsilon * 2,
      );
      return found ? found.clone() : pts3D[0].clone();
    });

    // 计算追踪结果面积
    const tracedArea = Math.abs(signedProjectedArea(traced3D, u, v));

    // 仅当追踪面积不小于原始面积时采用（排除退化）
    if (tracedArea >= result.signedArea - result.epsilon) {
      return {
        status: "polygon",
        points: traced3D,
        closedPoints: [
          ...traced3D.map((p) => p.clone()),
          traced3D[0].clone(),
        ],
        centroid: result.centroid,
        normal: result.normal.clone(),
        signedArea: tracedArea,
        basis: { u, v },
        epsilon: result.epsilon,
      };
    }
  } catch {
    // 追踪失败，回退
  }

  return result;
}
