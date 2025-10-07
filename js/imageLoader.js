import * as THREE from 'three';
import { createCaptionPanel } from './captionHelper.js'; // キャプション生成

// メイン関数：画像読み込みと計画適用
export async function loadImages(scene, imageFiles, wallWidth, wallHeight, fixedLongSide = 3, imageBasePath) {
  const MIN_MARGIN = 1.0;
  const MIN_SPACING = 0.5;
  const loader = new THREE.TextureLoader();

  // 画像情報のプリロード（サイズ取得＋テクスチャ化を並列処理）
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

  // 🔹 scene.userData に保存して applyWallLayouts でも参照可能に
  scene.userData.imageMetaList = imageMetaList;

  const layoutPlan = planWallLayouts(imageMetaList, wallWidth, MIN_MARGIN, MIN_SPACING);
  return applyWallLayouts(scene, layoutPlan, wallHeight);
}

// Three.js上に画像を貼る（キャプション含む）
export function applyWallLayouts(scene, layoutPlan, wallHeight) {
  const GALLERY_HEIGHT = wallHeight / 2;
  scene.userData.clickablePanels = scene.userData.clickablePanels || [];
  const imageMetaList = scene.userData.imageMetaList;

  const wallData = {
    front: { axis: 'x', origin: -Infinity, rotY: Math.PI },  // 横並び、後でoffset調整
    right: { axis: 'z', origin: -Infinity, rotY: Math.PI / 2 },
    left:  { axis: 'z', origin: Infinity, rotY: -Math.PI / 2 }
  };

  const meshes = [];

  layoutPlan.forEach(plan => {
    const wall = wallData[plan.wall];

    plan.images.forEach(imgPlan => {
      const meta = imageMetaList[imgPlan.index];

      // 壁の基準点からオフセットして配置
      const fx = wall.axis === 'x' ? wall.origin + imgPlan.offset : 0;
      const fz = wall.axis === 'z' ? wall.origin - imgPlan.offset : 0;
      const fy = GALLERY_HEIGHT;

      // フレーム作成
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(imgPlan.fw, imgPlan.fh, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      frame.position.set(fx, fy, fz);
      frame.rotation.y = wall.rotY;
      scene.add(frame);

      // パネル作成
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(imgPlan.fw * 0.95, imgPlan.fh * 0.95),
        new THREE.MeshBasicMaterial({ map: meta.texture, side: THREE.DoubleSide })
      );
      panel.position.copy(frame.position);

      const offsetVec = new THREE.Vector3(0, 0, 0.03);
      offsetVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), wall.rotY);
      panel.position.add(offsetVec);
      panel.rotation.y = wall.rotY;
      scene.add(panel);

      // クリック対象
      panel.userData.size = { width: imgPlan.fw, height: imgPlan.fh };
      scene.userData.clickablePanels.push(panel);

      // キャプション生成
      if (meta.title && meta.caption) {
        const aspect = imgPlan.fw / imgPlan.fh;
        const captionPanel = createCaptionPanel(panel, meta.title, meta.caption, aspect);
        panel.userData.captionPanel = captionPanel;
      }

      meshes.push(panel);
    });
  });

  return meshes;
}

// 壁幅・画像サイズから貼り付けプランを作成
export function planWallLayouts(imageMetaList, wallWidth, minMargin = 1.0, minSpacing = 0.5) {
  const wallNames = ['front', 'right', 'left'];
  const plans = [];
  let imageIndex = 0;

  for (const wallName of wallNames) {
    const availableWidth = wallWidth - 2 * minMargin;
    let count = 0;
    let totalWidth = 0;

    while (imageIndex + count < imageMetaList.length) {
      const fw = imageMetaList[imageIndex + count].fw;
      const spacing = count > 0 ? minSpacing : 0;
      if (totalWidth + spacing + fw > availableWidth) break;
      totalWidth += fw + spacing;
      count++;
    }

    if (count === 0) continue;

    const extraSpace = availableWidth - totalWidth;
    let offset = minMargin + extraSpace / 2;

    const wallPlan = { wall: wallName, images: [] };

    for (let i = 0; i < count; i++) {
      const idx = imageIndex + i;
      const { fw, fh } = imageMetaList[idx];

      wallPlan.images.push({
        index: idx,
        fw,
        fh,
        offset: offset + fw / 2
      });

      offset += fw + minSpacing;
    }

    plans.push(wallPlan);
    imageIndex += count;
  }

  return plans;
}
