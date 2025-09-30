import * as THREE from 'three';

// テキストを描画した CanvasTexture を返す
function createCaptionTexture(title, caption) {
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // タイトル
  ctx.fillStyle = 'white';
  ctx.font = '20px sans-serif';
  ctx.fillText(title, 20, 50);

  // 解説（改行対応）
  ctx.font = '10px sans-serif';
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
  const geometry = new THREE.PlaneGeometry(1.5, 0.75); // 固定サイズ
  const panel = new THREE.Mesh(geometry, material);

  // 画像サイズ（scaleで正規化済み）
  const halfW = imageMesh.scale.x / 2;
  const halfH = imageMesh.scale.y / 2;

  // 配置ロジック
  if (aspect > 1) {
    // 横長作品 → 下に配置（右端を合わせる）
    panel.position.set(
      halfW - g
