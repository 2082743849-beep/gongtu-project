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
// 凹形多边形排序 —— 可见性追踪法（索引追踪版，避免 2D→3D 坐标匹配错误）
// ---------------------------------------------------------------------------

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
 * 可见性追踪法 —— 返回索引顺序（不丢失原始点对应关系）
 *
 * 从最左下角出发，每步选择「最左转且不与已有边相交」的顶点，
 * 保证凹形截面（L 形、Z 形、阶梯形）正确闭合不产生自交。
 */
function traceConcavePolygonIndices(pts2d, eps) {
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
      if (lenSq < eps * eps) continue; // 退化/重复点跳过

      const cross = prevDir.x * dy - prevDir.y * dx;
      const dot = prevDir.x * dx + prevDir.y * dy;
      // atan2 范围 [-π, π]，越小 = 越左转
      const turn = Math.atan2(cross, dot);

      // 不穿过已有边
      let crosses = false;
      for (let j = 0; j < order.length - 1; j++) {
        if (
          segmentsCross2D(curr, cand, pts2d[order[j]], pts2d[order[j + 1]], eps)
        ) {
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
      // 所有候选都被边阻挡或退化 → 选最近未访问点
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
      if (bestIdx === -1) break; // 不应发生
    }

    const chosen = pts2d[bestIdx];
    prevDir = { x: chosen.x - curr.x, y: chosen.y - curr.y };
    visited.add(bestIdx);
    order.push(bestIdx);
  }

  return order; // 索引数组
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

// ---------------------------------------------------------------------------
// 上次结果缓存（避免相同输入重复计算导致屏闪）
// ---------------------------------------------------------------------------
const EPSILON_KEY = 1e-5;
let _cacheKey = "";
let _cachedResult = null;

function cacheKeyForPoints(pts3D, planeNormal, planeConstant) {
  // 用点的坐标+平面参数生成简单 hash
  const coords = pts3D.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`).join("|");
  return `${coords}|${planeConstant.toFixed(6)}|${planeNormal.x.toFixed(4)},${planeNormal.y.toFixed(4)},${planeNormal.z.toFixed(4)}`;
}

/**
 * 平面交点排序并闭合为多边形（增强版）
 *
 * 先用原始角度排序得到一个候选，再在 2D 投影空间用可见性追踪重排（索引追踪）。
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
  const eps = result.epsilon || 1e-6;

  // 缓存检查：如果输入没变直接返回上次结果（消除屏闪）
  const key = cacheKeyForPoints(pts3D, result.normal, plane.constant);
  if (_cacheKey === key && _cachedResult) {
    return _cachedResult;
  }

  // 投影到 2D
  const pts2D = pts3D.map((p) => ({ x: p.dot(u), y: p.dot(v) }));

  try {
    // 索引版追踪——不会丢失 3D 点的对应关系
    const idxOrder = traceConcavePolygonIndices(pts2D, eps);

    // 按索引重排 3D 点
    const traced3D = idxOrder.map((i) => pts3D[i].clone());

    // 计算追踪结果面积
    const tracedArea = Math.abs(signedProjectedArea(traced3D, u, v));

    // 仅当追踪面积 >= 原始面积时采用（凹形截面面积应该等于或略大于凸包面积）
    if (tracedArea >= result.signedArea - eps) {
      const finalResult = {
        status: "polygon",
        points: traced3D,
        closedPoints: [...traced3D.map((p) => p.clone()), traced3D[0].clone()],
        centroid: result.centroid,
        normal: result.normal.clone(),
        signedArea: tracedArea,
        basis: { u, v },
        epsilon: eps,
      };

      // 写入缓存
      _cacheKey = key;
      _cachedResult = finalResult;

      return finalResult;
    }
  } catch {
    // 追踪失败，回退
  }

  // 凸形或追踪失败：返回原始结果
  _cacheKey = key;
  _cachedResult = result;
  return result;
}
