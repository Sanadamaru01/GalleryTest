export function createCameraMover(camera, controls) {
  let moveStart = null;
  let moveFrom = new THREE.Vector3();
  let moveTo = new THREE.Vector3();
  const moveDuration = 0.6;

  let currentLookAt = new THREE.Vector3();
  let pendingTarget = null;

  function moveCameraTo(targetPos) {
    const newCamPos = targetPos.clone();
    newCamPos.y = camera.position.y;

    currentLookAt.copy(controls.target);
    pendingTarget = targetPos.clone();

    moveStart = performance.now() / 1000;
    moveFrom.copy(camera.position);
    moveTo.copy(newCamPos);
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
        }
      }
    }
  }

  return { moveCameraTo, animateCamera };
}
