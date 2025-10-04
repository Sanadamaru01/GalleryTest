import * as THREE from 'three';

export function createCameraMover(camera, controls) {
  let moveStart = null;
  let moveFrom = new THREE.Vector3();
  let moveTo = new THREE.Vector3();
  const moveDuration = 0.6;

  let currentLookAt = new THREE.Vector3();
  let pendingTarget = null;
// cameraMover.js
import * as THREE from 'three';

/**
 * カメラ移動用モジュール
 * 呼び出し側でカメラ位置と注視点を計算して渡す
 */
export function createCameraMover(camera, controls) {
  let moveStart = null;
  let moveFrom = new THREE.Vector3();
  let moveTo = new THREE.Vector3();
  const moveDuration = 0.6;

  let currentLookAt = new THREE.Vector3();
  let pendingTarget = null;

  /**
   * カメラ移動開始
   * @param {THREE.Vector3} lookAtPos - 移動先での注視点
   * @param {THREE.Vector3} camPos - 移動先のカメラ位置
   * @param {boolean} isReturn - 後退フラグ
   */
  function moveCameraTo(lookAtPos, camPos, isReturn = false) {
    moveFrom.copy(camera.position);
    moveTo.copy(camPos);

    if (isReturn) {
      // 後退時は今の注視点を保持して、到着後に切り替える
      currentLookAt.copy(controls.target);
      pendingTarget = lookAtPos.clone();
    } else {
      // 前進時は注視点を先に更新
      controls.target.copy(lookAtPos);
      currentLookAt.copy(lookAtPos);
      pendingTarget = null;
    }

    moveStart = performance.now() / 1000;
  }

  function animateCamera() {
    if (moveStart !== null) {
      const now = performance.now() / 1000;
      const elapsed = now - moveStart;
      const t = Math.min(elapsed / moveDuration, 1);

      camera.position.lerpVectors(moveFrom, moveTo, t);
      camera.lookAt(currentLookAt);

      if (t >= 1) {
        moveStart = null;

        if (pendingTarget) {
          controls.target.copy(pendingTarget);
          camera.lookAt(pendingTarget);
          pendingTarget = null;
        } else {
          camera.lookAt(controls.target);
        }
      }
    }
  }

  return { moveCameraTo, animateCamera };
}

  /**
   * lookAtPos: 注視点（カメラが向かう位置）
   * camPos: カメラ位置
   * isReturn: 後退かどうか
   */
  function moveCameraTo(lookAtPos, camPos, isReturn = false) {
    moveFrom.copy(camera.position);
    moveTo.copy(camPos);

    if (isReturn) {
      // 後退時は今の注視点を保持して、到着後に切り替える
      currentLookAt.copy(controls.target);
      pendingTarget = lookAtPos.clone();
    } else {
      // 前進時は先に注視点を更新
      controls.target.copy(lookAtPos);
      currentLookAt.copy(lookAtPos);
      pendingTarget = null;
    }

    moveStart = performance.now() / 1000;
  }

  function animateCamera() {
    if (moveStart !== null) {
      const now = performance.now() / 1000;
      const elapsed = now - moveStart;
      const t = Math.min(elapsed / moveDuration, 1);

      camera.position.lerpVectors(moveFrom, moveTo, t);
      camera.lookAt(currentLookAt);

      if (t >= 1) {
        moveStart = null;

        if (pendingTarget) {
          controls.target.copy(pendingTarget);
          camera.lookAt(pendingTarget);
          pendingTarget = null;
        } else {
          camera.lookAt(controls.target);
        }
      }
    }
  }

  return { moveCameraTo, animateCamera };
}
