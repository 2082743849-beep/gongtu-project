import * as THREE from "/node_modules/three/build/three.module.js";
import { OrbitControls } from "/node_modules/three/examples/jsm/controls/OrbitControls.js";

const canvas = document.querySelector("#geometryCanvas");
const viewport = canvas?.closest(".viewport");
const placeholder = document.querySelector("#stagePlaceholder");
const statusChip = document.querySelector(".status-chip");
const resetViewButton = document.querySelector('[aria-label="复位视角"]');

if (!(canvas instanceof HTMLCanvasElement) || !(viewport instanceof HTMLElement)) {
  throw new Error("空间几何实验室缺少必要的三维视口元素");
}

let renderer;

try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
} catch (error) {
  if (statusChip) {
    statusChip.textContent = "浏览器不支持 3D";
    statusChip.dataset.state = "error";
  }
  if (placeholder) {
    const message = placeholder.querySelector("span");
    if (message) {
      message.textContent = "当前浏览器无法启动 WebGL，请升级浏览器或检查图形加速设置。";
    }
  }
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
scene.name = "GongTuGeometryScene";

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.name = "MainPerspectiveCamera";
const defaultCameraPosition = new THREE.Vector3(5.4, 4.2, 6.8);
const defaultTarget = new THREE.Vector3(0, 0.35, 0);
camera.position.copy(defaultCameraPosition);
camera.lookAt(defaultTarget);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(defaultTarget);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.minDistance = 2.8;
controls.maxDistance = 18;
controls.minPolarAngle = 0.08;
controls.maxPolarAngle = Math.PI - 0.08;
controls.update();

const hemisphereLight = new THREE.HemisphereLight(0xfff8e8, 0x44645f, 2.1);
hemisphereLight.name = "HemisphereFill";
scene.add(hemisphereLight);

const keyLight = new THREE.DirectionalLight(0xfff1d2, 3.2);
keyLight.name = "KeyLight";
keyLight.position.set(5, 8, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 30;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xb6e1dc, 1.5);
rimLight.name = "RimLight";
rimLight.position.set(-6, 3, -4);
scene.add(rimLight);

function resizeRenderer() {
  const { width, height } = viewport.getBoundingClientRect();
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));

  renderer.setSize(safeWidth, safeHeight, false);
  camera.aspect = safeWidth / safeHeight;
  camera.updateProjectionMatrix();
}

const resizeObserver = new ResizeObserver(resizeRenderer);
resizeObserver.observe(viewport);
resizeRenderer();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

function updateCameraState() {
  canvas.dataset.cameraPosition = camera.position
    .toArray()
    .map((value) => value.toFixed(3))
    .join(",");
  canvas.dataset.cameraTarget = controls.target
    .toArray()
    .map((value) => value.toFixed(3))
    .join(",");
}

function resetView() {
  camera.position.copy(defaultCameraPosition);
  controls.target.copy(defaultTarget);
  controls.update();
  updateCameraState();
}

controls.addEventListener("change", updateCameraState);
resetViewButton?.addEventListener("click", resetView);
updateCameraState();

if (placeholder) {
  placeholder.hidden = true;
}
if (statusChip) {
  statusChip.textContent = "3D 场景已启动";
  statusChip.dataset.state = "ready";
}
canvas.dataset.sceneReady = "true";
canvas.dataset.renderer = "webgl";
canvas.dataset.camera = camera.name;
canvas.dataset.lightCount = "3";
canvas.dataset.clipping = String(renderer.localClippingEnabled);
canvas.dataset.orbitControls = "true";
canvas.dataset.zoomRange = `${controls.minDistance},${controls.maxDistance}`;

const geometryLab = Object.freeze({
  THREE,
  scene,
  camera,
  renderer,
  controls,
  lights: Object.freeze({
    hemisphere: hemisphereLight,
    key: keyLight,
    rim: rimLight,
  }),
});

window.geometryLab = geometryLab;
window.dispatchEvent(new CustomEvent("geometry:scene-ready", { detail: geometryLab }));

window.addEventListener(
  "pagehide",
  () => {
    resetViewButton?.removeEventListener("click", resetView);
    controls.removeEventListener("change", updateCameraState);
    controls.dispose();
    resizeObserver.disconnect();
    renderer.setAnimationLoop(null);
    renderer.dispose();
  },
  { once: true },
);
