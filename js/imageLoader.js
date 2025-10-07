import * as THREE from 'three';
import { createCaptionPanel } from './captionHelper.js'; // キャプション作成関数

// メイン関数：画像読み込みと計画適用
export async function loadImages(scene, imageFiles, wallWidth, wallHeight, fixedLongSide = 3, imageBasePath) {
  const MIN_MARGIN = 1.0;
  const MIN_SPACING = 0.5;
  const loader = new THREE.TextureLoader();

  // 画像情報のプリロード（サイズ取得＋テクスチャ化）
  const imageMetaList = await Promise.all(imageFiles.map(srcObj => {
    const src = typeof srcObj === 'string' ? srcObj : srcObj.file;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const iw = img.width;
        const ih = img.height;
        let fw, fh;

        if (iw >= ih) {
          fw = fixedLongSide;
          fh = fixedLongSide * (ih / iw);
        } else {
          fh = fixedLongSide;
          fw = fixedLongSide * (iw / ih);
        }

        loader.load(imageBasePath + src, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          resolve({ fw, fh, texture, src, title: srcObj.title, caption: srcObj.caption });
        });
      };
      img.src = imageBasePath + src;
    });
  }));

  // 壁ごとのレイアウト計画
  const layoutPlan = planWallLayouts(imageMetaList, wallWidth, MIN_MARGIN, MIN_SPACING);
  return applyWallLayouts(scene, layoutPlan, wallHeight); // 画像とキャプションを同時に配置
}

// 壁幅・画像サイズから貼り付けプランを作成（中央基準）
function planWallLayouts(imageMetaList, wallWidth, minMargin, minSpacing) {
  const wallNames = ['front', 'right', 'left'];
  const plans = [];
  let imageIndex = 0;

  for (const wallName of wallNames) {
    const availableWidth = wallWidth - 2 * minMargin;
    let wallImages = [];
    let totalWidth = 0;

    // 壁に収まる枚数を計算
    while (imageIndex < imageMetaList.length) {
      const { fw } = imageMetaList[imageIndex];
      const spacing = wallImages.length > 0 ? minSpacing : 0;
      if (totalWidth + fw + spacing > availableWidth) break;
      totalWidth += fw + spacing;
      wallImages.push({ index: imageIndex, fw });
      imageIndex++;
    }

    if (wallImages.length === 0) continue;

    // 壁中央基準でのオフセット計算
    let offset = -totalWidth / 2;
    wallImages.forEach(img => {
      img.offset = offset + img.fw / 2;
      offset += img.fw + minSpacing;
    });

    plans.push({ wall: wallName, images: wallImages });
  }

  return plans;
}

// Three.js上に画像を貼る（キャプションも同時に配置）
function applyWallLayouts(scene, layoutPlan, wallHeight) {
  const GALLERY_HEIGHT = wallHeight / 2;
  scene.userData.clickablePanels = scene.userData.clickablePanels || [];
  const meshes = [];

  const wallData = {
    front: { axis: 'x', origin: 0, z: wallHeight / 2 - 0.1, rotY: Math.PI },
    right: { axis: 'z', origin: 0, x: -wallHeight / 2 + 0.1, rotY: Math.PI / 2 },
    left:  { axis: 'z', origin: 0, x: wallHeight / 2 - 0.1, rotY: -Math.PI / 2 }
  };

  layoutPlan.forEach(plan => {
    const wall = wallData[plan.wall];
    plan.images.forEach(imgInfo => {
      const meta = scene.userData.imageMetaList[imgInfo.index];
      const { fw, fh, texture } = meta;

      const fx = wall.axis === 'x' ? wall.origin + imgInfo.offset : wall.x;
      const fz = wall.axis === 'z' ? wall.origin + imgInfo.offset : wall.z;
      const fy = GALLERY_HEIGHT;

      // フレーム
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(fw, fh, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      frame.position.set(fx || 0, fy, fz || 0);
      frame.rotation.y = wall.rotY;
      scene.add(frame);

      // 画像
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(fw * 0.95, fh * 0.95),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
      );
      panel.position.copy(frame.position);
      panel.rotation.y = wall.rotY;
      const offsetVec = new THREE.Vector3(0, 0, 0.03);
      offsetVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), wall.rotY);
      panel.position.add(offsetVec);
      scene.add(panel);

      // クリック対象
      panel.userData.size = { width: fw, height: fh };
      scene.userData.clickablePanels.push(panel);

      // キャプション
      if (meta.title && meta.caption) {
        const aspect = fw / fh;
        const captionPanel = createCaptionPanel(panel, meta.title, meta.caption, aspect);
        panel.userData.captionPanel = captionPanel;
      }

      meshes.push(panel);
    });
  });

  return meshes;
}
