import * as THREE from 'three';

// テキストを描画した CanvasTexture を返す
function createCaptionTexture(title, caption) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // タイトル
  ctx.fillStyle = 'white';
  ctx.font = '28px sans-serif';
  ctx.fillText(title, 20, 50);

  // 解説（改行対応）
  ctx.font = '20px sans-serif';
  wrapText(ctx, caption, 20, 100, 460, 28);

  return new THREE.CanvasTexture(canvas);
}

// 長文対応の改行処理
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split('');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// キャプションパネルを生成して返す
export function createCaptionPanel(imageMesh, title, caption, aspect) {
  const texture = createCaptionTexture(title, caption);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  const geometry = new THREE.PlaneGeometry(1.5, 0.75);
  const panel = new THREE.Mesh(geometry, material);

  // 配置ロジック
  if (aspect > 1) {
    // 横長作品 → 下に配置
    panel.position.set(0.75, -0.6, 0.01);
    panel.scale.set(imageMesh.scale.x, imageMesh.scale.x, 1);
  } else {
    // 縦長作品 → 右に配置
    panel.position.set(0.6, -0.75, 0.01);
    panel.scale.set(imageMesh.scale.y, imageMesh.scale.y, 1);
  }

  imageMesh.add(panel);
  panel.visible = false; // 初期は非表示
  return panel;
}
