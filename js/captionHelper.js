import * as THREE from 'three';

// テキストを描画した CanvasTexture を返す
function createCaptionTexture(title, caption) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // タイトル
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText(title, 10, 24);

  // 解説（改行対応）
  ctx.font = '12px sans-serif';
  wrapText(ctx, caption, 10, 48, canvas.width - 20, 18);

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

  // パネルサイズを幅0.4、高さ0.2に固定
  const panelWidth = 0.4;
  const panelHeight = 0.2;
  const geometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
  const panel = new THREE.Mesh(geometry, material);

  // 画像サイズ取得
  const halfW = imageMesh.scale.x / 2;
  const halfH = imageMesh.scale.y / 2;

  // 配置ロジック：画像の外側に配置
  if (aspect > 1) {
    // 横長作品 → 下に配置、右端を画像右端に揃える
    panel.position.set(
      halfW - panelWidth / 2,
      -halfH - panelHeight / 2,
      0.01
    );
  } else {
    // 縦長作品 → 右に配置、下端を画像下端に揃える
    panel.position.set(
      halfW + panelWidth / 2,
      -halfH + panelHeight / 2,
      0.01
    );
  }

  imageMesh.add(panel);
  panel.visible = false; // 初期は非表示
  return panel;
}
