import * as THREE from 'three';
import { createCaptionPanel } from './captionHelper.js';

// メイン関数：画像読み込みと計画適用
export async function loadImages(scene, imageFiles, wallWidth, wallHeight, fixedLongSide = 3, imageBasePath) {
  const MIN_MARGIN = 1.0;
  const MIN_SPACING = 0.5;
  const loader = new THREE.TextureLoader();

  // 画像情報のプリロード
  const imageMetaList = await Promise.all(imageFiles.map(srcObj => {
    const src = typeof srcObj === 'string' ? srcObj : srcObj.file;
    return new Promise(resolve => {
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

        loader.load(imageBasePath + src, texture => {
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

  const imageSizes = imageMetaList.map(item => ({ fw: item.fw, fh: item.fh }));
  const layoutPlan = planWallLayouts(imageSizes, wallWidth, MIN_MARGIN, MIN_SPACING);
  return applyWallLayouts(scene, layoutPlan, imageMetaList, wallWidth, wallHeight);
}

// Three.js上に画像を貼る
export function applyWallLayouts(scene, layoutPlan, imageMetaList, wallWidth, wallHeight) {
  const GALLERY_HEIGHT = wallHeight / 2;
  scene.userData.clickablePanels = scene.userData.clickablePanels || [];

  const wallData = {
    front: { axis: 'x', z: 0, rotY: Math.PI },         // 正面
    right: { axis: 'z', x: 0, rotY: Math.PI / 2 },    // 右
    left:  { axis: 'z', x: 0, rotY: -Math.PI / 2 }    // 左
  };

  const meshes = [];

  layoutPlan.forEach(plan => {
    const wall = wallData[plan.wall];
    const totalWidth = plan.images.reduce((sum, img) => sum + img.fw, 0) + (plan.images.length - 1) * 0.5; // minSpacing = 0.5
    let startOffset = -totalWidth / 2;

    plan.images.forEach((img, i) => {
      const meta = imageMetaList[img.index];
      const texture = meta.texture;

      // 横方向の位置を決定（壁の中心を基準）
      const imgOffset = startOffset + img.fw / 2;
      startOffset += img.fw + 0.5; // 次の画像のオフセット

      let fx = 0, fz = 0;
      if (wall.axis === 'x') fx = imgOffset; // 正面
      if (wall.axis === 'z') fz = imgOffset; // 左・右

      const fy = GALLERY_HEIGHT;

      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(img.fw, img.fh, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      frame.position.set(fx, fy, fz);
      frame.rotation.y = wall.rotY;
      scene.add(frame);

      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(img.fw * 0.95, img.fh * 0.95),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
      );
      panel.position.copy(frame.position);
      panel.rotation.y = wall.rotY;

      const offsetVec = new THREE.Vector3(0, 0, 0.03);
      offsetVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), wall.rotY);
      panel.position.add(offsetVec);
      scene.add(panel);

      // クリック対象に追加
      panel.userData.size = { width: img.fw, height: img.fh };
      scene.userData.clickablePanels.push(panel);

      // キャプションパネル生成
      if (meta.title && meta.caption) {
        const aspect = img.fw / img.fh;
        const captionPanel = createCaptionPanel(panel, meta.title, meta.caption, aspect);
        panel.userData.captionPanel = captionPanel;
      }

      meshes.push(panel);
    });
  });

  return meshes;
}

// 壁幅・画像サイズから貼り付けプランを作成
export function planWallLayouts(imageSizes, wallWidth, minMargin, minSpacing) {
  const wallNames = ['front', 'right', 'left'];
  const plans = [];
  let imageIndex = 0;

  for (const wallName of wallNames) {
    const availableWidth = wallWidth - 2 * minMargin;
    let count = 0;
    let totalImageWidth = 0;

    while (imageIndex + count < imageSizes.length) {
      const w = imageSizes[imageIndex + count].fw;
      const spacing = count > 0 ? minSpacing : 0;
      if (totalImageWidth + spacing + w > availableWidth) break;
      totalImageWidth += spacing + w;
      count++;
    }

    if (count === 0) continue;

    const wallPlan = { wall: wallName, images: [] };

    for (let i = 0; i < count; i++) {
      const idx = imageIndex + i; // index は順序通り保持
      const { fw, fh } = imageSizes[idx];
      wallPlan.images.push({ index: idx, fw, fh });
    }

    plans.push(wallPlan);
    imageIndex += count;
  }

  return plans;
}
