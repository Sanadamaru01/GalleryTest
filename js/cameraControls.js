import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCameraMover } from './cameraMover.js';

export function setupCameraControls(camera, renderer, controlsTargetY, floor, scene) {
  console.log('[cameraControls] called');

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;// cameraControls.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCameraMover } from './cameraMover.js';

/**
 * カメラコントロール設定モジュール
 * パネルクリック・床クリックでcameraMoverを呼び出す
 */
export function setupCameraControls(camera, renderer, controlsTargetY, floor, scene) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.mouseButtons.RIGHT = null;
  controls.dampingFactor = 0.1;
  controls.rotateSpeed = -0.1;
  controls.minPolarAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 2;
  controls.target.set(0, controlsTargetY, 0);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let isClick = false;
  let clickStartTime = 0;

  // パネルの前後移動のための記録
  let lastPanel = null;
  let lastCameraPos = new THREE.Vector3();
  let lastCameraTarget = new THREE.Vector3();

  const cameraMover = createCameraMover(camera, controls);

  // --- マウスイベント ---
  window.addEventListener('mousedown', () => {
    isClick = true;
    clickStartTime = performance.now();
  });

  window.addEventListener('mousemove', () => {
    if (performance.now() - clickStartTime > 200) isClick = false;
  });

  window.addEventListener('mouseup', (event) => {
    if (!isClick) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // パネルクリック処理
    const panels = scene.userData.clickablePanels || [];
    const hits = raycaster.intersectObjects(panels);
    if (hits.length > 0) {
      const panel = hits[0].object;

      if (lastPanel === panel) {
        // 同じパネル再クリック → 後退
        cameraMover.moveCameraTo(lastCameraTarget, lastCameraPos, true);
        lastPanel = null;
        return;
      }

      // 新しいパネルクリック → 前進
      lastPanel = panel;
      lastCameraPos.copy(camera.position);
      lastCameraTarget.copy(controls.target);

      const panelCenter = new THREE.Vector3();
      panel.getWorldPosition(panelCenter);

      const panelNormal = new THREE.Vector3(0,0,-1).applyQuaternion(panel.quaternion).normalize();
      const camPos = panelCenter.clone().addScaledVector(panelNormal, -0.5);
      const lookAt = panelCenter.clone(); // パネル中心を見る
      cameraMover.moveCameraTo(lookAt, camPos);
      return;
    }

    // 床クリック処理
    const floorHits = raycaster.intersectObject(floor);
    if (floorHits.length > 0) {
      const clicked = floorHits[0].point;
      const wallLimit = scene.userData.wallWidth / 2 - 0.5;
      if (Math.abs(clicked.x) > wallLimit || Math.abs(clicked.z) > wallLimit) return;

      const camPos = new THREE.Vector3(clicked.x, camera.position.y, clicked.z);
      const lookAt = camera.getWorldDirection(new THREE.Vector3()).add(camera.position); // 現在の向き
      cameraMover.moveCameraTo(lookAt, camPos);

      lastPanel = null;
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    controls,
    animateCamera: cameraMover.animateCamera
  };
}

  controls.enablePan = false;
  controls.mouseButtons.RIGHT = null;
  controls.dampingFactor = 0.1;
  controls.rotateSpeed = -0.1;
  controls.minPolarAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 2;
  controls.target.set(0, controlsTargetY, 0);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let isClick = false;
  let clickStartTime = 0;

  let lastPanel = null;
  let lastCameraPos = new THREE.Vector3();
  let lastCameraTarget = new THREE.Vector3();

  const { moveCameraTo, animateCamera } = createCameraMover(camera, controls);

  window.addEventListener('mousedown', () => {
    isClick = true;
    clickStartTime = performance.now();
  });

  window.addEventListener('mousemove', () => {
    if (performance.now() - clickStartTime > 200) isClick = false;
  });

  window.addEventListener('mouseup', (event) => {
    if (!isClick) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // パネルクリック
    const panels = scene.userData.clickablePanels || [];
    const hits = raycaster.intersectObjects(panels);
    if (hits.length > 0) {
      const panel = hits[0].object;

      if (lastPanel === panel) {
        moveCameraTo(lastCameraTarget, lastCameraPos, true); // 後退
        lastPanel = null;
        return;
      }

      lastPanel = panel;
      lastCameraPos.copy(camera.position);
      lastCameraTarget.copy(controls.target);

      const panelCenter = new THREE.Vector3();
      panel.getWorldPosition(panelCenter);

      const panelNormal = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(panel.quaternion)
        .normalize();

      const lookAtPos = panelCenter.clone().addScaledVector(panelNormal, -1);
      const camPos = panelCenter.clone().addScaledVector(panelNormal, -0.5);
      camPos.y = camera.position.y;

      moveCameraTo(lookAtPos, camPos);
      return;
    }

    // 床クリック
    const floorHits = raycaster.intersectObject(floor);
    if (floorHits.length > 0) {
      const clicked = floorHits[0].point;
      const wallLimit = scene.userData.wallWidth / 2 - 0.5;
      if (Math.abs(clicked.x) > wallLimit || Math.abs(clicked.z) > wallLimit) return;

      const lookAtPos = new THREE.Vector3(clicked.x, controls.target.y, clicked.z);
      const camPos = new THREE.Vector3(clicked.x, camera.position.y, clicked.z);
      moveCameraTo(lookAtPos, camPos);
      lastPanel = null;
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { controls, animateCamera };
}
