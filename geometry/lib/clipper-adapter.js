/**
 * ESM 适配器 — 将 clipper-lib（UMD 全局变量）包装为 ES 模块导出。
 *
 * 原库暴露全局变量 ClipperLib，此处动态加载后 re-export。
 */
import "/node_modules/clipper-lib/clipper.js";

const CL = globalThis.ClipperLib;

if (!CL) {
  throw new Error(
    "clipper-lib 未正确加载：确保 /node_modules/clipper-lib/clipper.js 可通过 <script> 或 import 访问"
  );
}

export const ClipperLib = CL;

/**
 * 用 Clipper 清理多边形（Union 操作消除自交、重复点、共线边）。
 * 输入输出均为 [[{X,Y}, {X,Y}, ...], ...] 格式（Clipper 整数坐标）。
 *
 * @param {Array<Array<{X:number,Y:number}>>} paths - 输入多边形路径
 * @param {number} [scale=1000] - 浮点→整数缩放因子（精度）
 * @returns {Array<Array<{X:number,Y:number}>>} 清理后的路径
 */
export function cleanPolygonPaths(paths, scale = 1000) {
  const co = new CL.Clipper();
  co.StrictlySimple = true; // 防止自交

  // 使用 Union 合并清理
  co.AddPaths(paths, CL.PolyType.ptSubject, true); // true = closed
  const solution = new CL.Paths();
  co.Execute(CL.ClipType.ctUnion, solution, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);

  return solution;
}

/**
 * 将 THREE.Vector3 数组投影到 2D 并转为 Clipper 整数坐标格式。
 */
export function pointsToClipperPaths(points3d, u, v, scale = 1000) {
  const path = points3d.map((p) => ({
    X: Math.round(p.dot(u) * scale),
    Y: Math.round(p.dot(v) * scale),
  }));
  return [path];
}

/**
 * 将 Clipper 整数坐标转回 THREE.Vector3 数组。
 */
export function clipperPathToPoints3d(clipperPath, u, v, scale = 1000, normal) {
  return clipperPath.map((pt) => {
    const x = pt.X / scale;
    const y = pt.Y / scale;
    const vec = new (u.constructor)().copy(u).multiplyScalar(x).add(v.clone().multiplyScalar(y));
    return vec;
  });
}
