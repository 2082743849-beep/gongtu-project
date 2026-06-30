import assert from "node:assert/strict";
import test from "node:test";

import * as THREE from "three";
import { createCube } from "../geometry/box-generator.js";
import {
  collectWorldEdges,
  intersectEdgesWithPlane,
  intersectSegmentWithPlane,
} from "../geometry/plane-intersections.js";

const X_ZERO_PLANE = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

function vector(x, y = 0, z = 0) {
  return new THREE.Vector3(x, y, z);
}

function roundedPoint(point) {
  return point.toArray().map((value) => Math.round(value * 1e9) / 1e9);
}

test("segment crossing returns the interpolated point", () => {
  const result = intersectSegmentWithPlane(
    vector(-2, 1, 0),
    vector(1, 1, 0),
    X_ZERO_PLANE,
  );
  assert.equal(result.status, "crossing");
  assert.deepEqual(roundedPoint(result.point), [0, 1, 0]);
  assert.equal(result.interpolation, 2 / 3);
});

test("segment on one side does not intersect", () => {
  const result = intersectSegmentWithPlane(vector(0.1), vector(2), X_ZERO_PLANE);
  assert.equal(result.status, "none");
});

test("endpoint on the plane is returned exactly once", () => {
  const result = intersectSegmentWithPlane(vector(0), vector(2), X_ZERO_PLANE);
  assert.equal(result.status, "endpoint");
  assert.deepEqual(roundedPoint(result.point), [0, 0, 0]);
});

test("coplanar segment preserves both endpoints", () => {
  const result = intersectSegmentWithPlane(
    vector(0, -1, 0),
    vector(0, 1, 0),
    X_ZERO_PLANE,
  );
  assert.equal(result.status, "coplanar");
  assert.deepEqual(result.points.map(roundedPoint), [
    [0, -1, 0],
    [0, 1, 0],
  ]);
});

test("near-plane endpoint respects the configured tolerance", () => {
  const result = intersectSegmentWithPlane(
    vector(5e-8),
    vector(1),
    X_ZERO_PLANE,
    { epsilon: 1e-7 },
  );
  assert.equal(result.status, "endpoint");
});

test("batch intersection deduplicates shared vertex hits", () => {
  const shared = vector(0, 0, 0);
  const result = intersectEdgesWithPlane(
    [
      [shared, vector(1, 0, 0)],
      [shared, vector(1, 1, 0)],
      [vector(-1, 0, 0), vector(1, 0, 0)],
    ],
    X_ZERO_PLANE,
  );
  assert.equal(result.hits.length, 3);
  assert.equal(result.points.length, 1);
  assert.deepEqual(roundedPoint(result.points[0]), [0, 0, 0]);
});

test("batch intersection reports coplanar edges separately", () => {
  const result = intersectEdgesWithPlane(
    [
      [vector(0, -1, 0), vector(0, 1, 0)],
      [vector(-1, 0, 0), vector(1, 0, 0)],
    ],
    X_ZERO_PLANE,
  );
  assert.equal(result.coplanarEdges.length, 1);
  assert.equal(result.points.length, 3);
});

test("cube world edges produce four unique points through its center", () => {
  const cube = createCube(2);
  cube.position.set(3, 4, -2);
  const edges = collectWorldEdges(cube);
  const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -3);
  const result = intersectEdgesWithPlane(edges, plane);

  assert.equal(edges.length, 12);
  assert.equal(result.points.length, 4);
  assert.deepEqual(
    result.points.map(roundedPoint).sort(),
    [
      [3, 3, -3],
      [3, 3, -1],
      [3, 5, -3],
      [3, 5, -1],
    ].sort(),
  );
});

test("zero-normal plane and malformed edges fail explicitly", () => {
  assert.throws(
    () => intersectEdgesWithPlane([], new THREE.Plane(vector(0), 0)),
    /non-zero normal/,
  );
  assert.throws(
    () => intersectEdgesWithPlane([[vector(0), null]], X_ZERO_PLANE),
    /start and end/,
  );
});
