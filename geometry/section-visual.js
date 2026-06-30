import * as THREE from "/node_modules/three/build/three.module.js";
import earcut from "/node_modules/earcut/src/earcut.js";
import { pointsToClipperPaths, cleanPolygonPaths, clipperPathToPoints3d } from "./lib/clipper-adapter.js";

/**
 * 从法向量构造平面局部 2D 基 (u, v)。
 * 当 polygon.basis 不可用时作为 fallback。
 */
function makeOrthoBasis(normal) {
  const ref = Math.abs(normal.z) < 0.9
    ? new THREE.Vector3(0, 0, 1)
    : new THREE.Vector3(0, 1, 0);
  const u = ref.clone().cross(normal).normalize();
  const v = normal.clone().cross(u).normalize();
  return { u, v };
}

function emptyGeometry() {
  return new THREE.BufferGeometry();
}

/**
 * 创建可重复更新的截面封口与轮廓。
 *
 * 渲染管线：
 *   3D 顶点 → 投影到平面局部 2D → Clipper 清理（Union 消除自交/共线）
 *     → earcut 三角化 → 还原回 3D 坐标 → BufferGeometry
 *
 * 输入顶点使用世界坐标，因此该组应直接加入主场景且保持单位变换。
 */
export function createSectionVisual({
  fillColor = 0xf2b84b,
  outlineColor = 0xc1523b,
  fillOpacity = 0.58,
  surfaceOffset = 0.0001, // 极小偏移防止 z-fighting（原 0.001 太大导致可见间隙）
} = {}) {
  const group = new THREE.Group();
  group.name = "LiveSectionVisual";
  group.visible = false;

  const fillMaterial = new THREE.MeshBasicMaterial({
    color: fillColor,
    transparent: true,
    opacity: fillOpacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const outlineMaterial = new THREE.LineBasicMaterial({
    color: outlineColor,
    transparent: true,
    opacity: 0.98,
    depthTest: false,
    depthWrite: false,
  });
  const fill = new THREE.Mesh(emptyGeometry(), fillMaterial);
  const outline = new THREE.Line(emptyGeometry(), outlineMaterial);
  fill.name = "SectionFill";
  outline.name = "SectionOutline";
  fill.renderOrder = 4;
  outline.renderOrder = 5;
  group.add(fill, outline);

  function clear() {
    fill.geometry.dispose();
    outline.geometry.dispose();
    fill.geometry = emptyGeometry();
    outline.geometry = emptyGeometry();
    group.visible = false;
    group.userData = {
      status: "empty",
      vertexCount: 0,
      area: 0,
    };
  }

  /**
   * 核心更新函数 — 使用 earcut + clipper 管线。
   */
  function update(polygon) {
    if (polygon?.status !== "polygon" || polygon.points.length < 3) {
      clear();
      return false;
    }

    // 1. 获取局部 2D 基
    const { u, v } = polygon.basis
      ? polygon.basis
      : makeOrthoBasis(polygon.normal);

    // 2. 沿法向做极小偏移（z-fighting 防护）
    const offset = Number.isFinite(surfaceOffset) ? surfaceOffset : 0.0001;
    const displayPoints = polygon.points.map((point) =>
      point.clone().addScaledVector(polygon.normal, offset)
    );

    // 3. 投影到 2D（浮点坐标）
    const pts2d = displayPoints.map((p) => ({
      x: p.dot(u),
      y: p.dot(v),
    }));

    // 4. 用 Clipper 清理多边形（消除自交、重复点、共线退化边）
    let cleaned2d;
    try {
      const scale = 10000; // 高精度缩放
      const clipperPaths = pointsToClipperPaths(displayPoints, u, v, scale);
      const cleaned = cleanPolygonPaths(clipperPaths, scale);

      if (!cleaned || cleaned.length === 0) throw new Error("Clipper 返回空结果");

      // 取最大的路径作为主多边形（Union 可能产生多个分离环）
      let mainPath = cleaned[0];
      let maxArea = 0;
      for (const path of cleaned) {
        const area = Math.abs(signedArea2D(path));
        if (area > maxArea) {
          maxArea = area;
          mainPath = path;
        }
      }

      // 转回浮点坐标
      cleaned2d = mainPath.map((pt) => ({
        x: pt.X / scale,
        y: pt.Y / scale,
      }));
    } catch (clipErr) {
      // Clipper 失败时降级使用原始点（不应发生但需防御）
      console.warn("clipper 清理失败，使用原始顶点:", clipErr.message);
      cleaned2d = pts2d;
    }

    // 5. earcut 三角化（Mapbox 出品，支持任意凹多边形）
    let nextFillGeometry;
    try {
      const flatCoords = [];
      for (const p of cleaned2d) {
        flatCoords.push(p.x, p.y);
      }
      const triangles = earcut(flatCoords); // 返回三角索引 [v0,v1,v2, v0,v2,v3, ...]

      if (!triangles || triangles.length < 3) {
        throw new Error("earcut 未产出有效三角形");
      }

      // 还原 3D 顶点（基于清理后的 2D 坐标）
      const verts3d = [];
      for (const p of cleaned2d) {
        verts3d.push(
          u.clone().multiplyScalar(p.x).add(v.clone().multiplyScalar(p.y))
        );
      }

      // 按 earcat 索引构建 BufferGeometry
      const positions = new Float32Array(triangles.length * 3);
      for (let ti = 0; ti < triangles.length; ti++) {
        const vi = triangles[ti];
        const vec = verts3d[vi];
        positions[ti * 3] = vec.x;
        positions[ti * 3 + 1] = vec.y;
        positions[ti * 3 + 2] = vec.z;
      }

      nextFillGeometry = new THREE.BufferGeometry();
      nextFillGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      nextFillGeometry.computeVertexNormals();
    } catch (triErr) {
      // earcut 失败的终极 fallback：扇形三角化（仅对凸形正确）
      console.warn("earcut 三角化失败:", triErr.message);
      const indices = [];
      for (let i = 1; i < cleaned2d.length - 1; i++) {
        indices.push(0, i, i + 1);
      }
      const verts3d = cleaned2d.map((p) =>
        u.clone().multiplyScalar(p.x).add(v.clone().multiplyScalar(p.y))
      );
      nextFillGeometry = new THREE.BufferGeometry().setFromPoints(verts3d);
      nextFillGeometry.setIndex(indices);
      nextFillGeometry.computeVertexNormals();
    }

    // 6. 轮廓线（基于清理后的顶点顺序）
    const outline3d = cleaned2d.map((p) =>
      u.clone().multiplyScalar(p.x).add(v.clone().multiplyScalar(p.y))
    );
    const closedOutline3d = [...outline3d, outline3d[0].clone()];
    const nextOutlineGeometry = new THREE.BufferGeometry().setFromPoints(closedOutline3d);

    // 7. 应用到 mesh
    fill.geometry.dispose();
    outline.geometry.dispose();
    fill.geometry = nextFillGeometry;
    outline.geometry = nextOutlineGeometry;
    group.visible = true;
    group.userData = {
      status: "visible",
      vertexCount: cleaned2d.length,
      area: polygon.signedArea,
    };
    return true;
  }

  function dispose() {
    fill.geometry.dispose();
    outline.geometry.dispose();
    fillMaterial.dispose();
    outlineMaterial.dispose();
  }

  clear();

  return Object.freeze({
    group,
    fill,
    outline,
    update,
    clear,
    dispose,
  });
}

// ── 辅助函数 ──

/** 计算有符号面积（整数坐标版，用于 Clipper 路径） */
function signedArea2D(path) {
  let area = 0;
  for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
    area += (path[i].X - path[j].X) * (path[i].Y + path[j].Y);
  }
  return area / 2;
}
