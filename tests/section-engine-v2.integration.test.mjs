import assert from "node:assert/strict";
import test from "node:test";

import * as THREE from "three";
import {
  compareSectionV1V2,
  computeSectionV2,
} from "../geometry/section-engine-v2.js";

function horizontalPlane(y = 0) {
  return new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);
}

test("indexed box geometry completes the full V2 pipeline in world coordinates", () => {
  const root = new THREE.Group();
  root.position.set(3, 2, -4);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
  root.add(mesh);

  const result = computeSectionV2(root, horizontalPlane(2));

  assert.equal(result.status, "ok");
  assert.equal(result.contourCount, 1);
  assert.ok(Math.abs(result.area - 4) < 1e-6);
  assert.equal(result.diagnostics.meshCount, 1);
  assert.equal(result.diagnostics.triangleCount, 12);
  assert.equal(result.triangulation.indices.length, 18);
  assert.ok(result.contours[0].points.every((point) => Math.abs(point.y - 2) < 1e-7));
});

test("non-indexed geometry is supported", () => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2).toNonIndexed());
  const result = computeSectionV2(mesh, horizontalPlane());

  assert.equal(result.status, "ok");
  assert.equal(result.contourCount, 1);
  assert.ok(Math.abs(result.area - 4) < 1e-6);
});

test("two disconnected meshes produce two contours and summed area", () => {
  const root = new THREE.Group();
  const left = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  const right = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1));
  left.position.x = -2;
  right.position.x = 2;
  root.add(left, right);

  const result = computeSectionV2(root, horizontalPlane());

  assert.equal(result.status, "ok");
  assert.equal(result.contourCount, 2);
  assert.ok(Math.abs(result.area - 3) < 1e-6);
  assert.equal(result.topology.groups.length, 2);
});

test("plane outside model returns a stable empty result", () => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  const result = computeSectionV2(mesh, horizontalPlane(5));

  assert.equal(result.status, "empty");
  assert.equal(result.contourCount, 0);
  assert.equal(result.area, 0);
  assert.equal(result.diagnostics.rawSegmentCount, 0);
});

test("overlapping shells are returned as an explicit topology-stage error", () => {
  const root = new THREE.Group();
  const first = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  const second = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  second.position.x = 0.25;
  root.add(first, second);

  const result = computeSectionV2(root, horizontalPlane());

  assert.equal(result.status, "error");
  assert.equal(result.stage, "topology");
  assert.equal(result.error, "intersecting-rings");
});

test("comparison reports a matching legacy polygon without changing either result", () => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
  const v2 = computeSectionV2(mesh, horizontalPlane());
  const comparison = compareSectionV1V2(
    { status: "visible", contourCount: 1, area: 4 },
    v2,
  );

  assert.equal(comparison.match, true);
  assert.equal(comparison.statusMatch, true);
  assert.equal(comparison.contourCountMatch, true);
  assert.equal(comparison.areaMatch, true);
});

test("comparison records status, contour and area differences", () => {
  const comparison = compareSectionV1V2(
    { status: "visible", area: 1 },
    { status: "error", stage: "contours", error: "open-chain", contourCount: 0, area: 0 },
  );

  assert.equal(comparison.match, false);
  assert.equal(comparison.statusMatch, false);
  assert.equal(comparison.contourCountMatch, false);
  assert.equal(comparison.areaMatch, false);
  assert.equal(comparison.areaDelta, 1);
  assert.equal(comparison.v2.error, "open-chain");
});

test("invalid root and plane are rejected before traversal", () => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  assert.throws(() => computeSectionV2(null, horizontalPlane()), /THREE.Object3D/);
  assert.throws(
    () => computeSectionV2(mesh, new THREE.Plane(new THREE.Vector3(), 0)),
    /non-zero normal/,
  );
});
