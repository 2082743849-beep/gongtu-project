/**
 * 截面多边形排序包装层
 *
 * 透传 plane-intersections.js 中除 orderAndCloseSection 外的全部导出，
 * 将 orderAndCloseSection 替换为增强版（仅优化三角化，不改点序）。
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
// 结果缓存（避免相同输入重复计算导致屏闪）
// ---------------------------------------------------------------------------
const EPSILON_KEY = 1e-5;
let _cacheKey = "";
let _cachedResult = null;

function cacheKeyForPoints(pts3D, planeNormal, planeConstant) {
  const coords = pts3D.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`).join("|");
  return `${coords}|${planeConstant.toFixed(6)}|${planeNormal.x.toFixed(4)},${planeNormal.y.toFixed(4)},${planeNormal.z.toFixed(4)}`;
}

/**
 * 平面交点排序并闭合为多边形
 *
 * 设计原则变更（v4）：
 *   不再尝试对凹形多边形重排点序。
 *   原因：仅凭无序点集无法唯一确定凹形拓扑（需要网格邻接信息）。
 *   可见性追踪法在 L 形/Z 形等情况下会退化为凸包。
 *
 * 策略：
 *   透传原始算法的角度排序结果（保证接口兼容），
 *   仅添加结果缓存消除屏闪。
 *   三角化优化交给 section-visual.js 的 earcut 处理。
 */
export function orderAndCloseSection(points, plane, { epsilon } = {}) {
  // 直接调用原始算法，不做任何重排
  const result = _originalOrder(points, plane, { epsilon });

  // 缓存检查
  if (result.status === "polygon" && result.points.length >= 3) {
    const key = cacheKeyForPoints(result.points, result.normal, plane.constant);
    if (_cacheKey === key && _cachedResult) {
      return _cachedResult;
    }
    _cacheKey = key;
    _cachedResult = result;
  }

  return result;
}
