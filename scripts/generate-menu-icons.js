/**
 * 生成菜单列表 PNG 图标（48×48，#3182ce 描边风格）。
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const SIZE = 48;
const dir = path.join(__dirname, '..', 'src', 'assets', 'menu');
const COLOR = { r: 49, g: 130, b: 206, a: 255 };
const MUTED = { r: 148, g: 163, b: 184, a: 255 };
const T = 3;

function createCanvas() {
  const png = new PNG({ width: SIZE, height: SIZE });
  for (let i = 0; i < png.data.length; i += 4) png.data[i + 3] = 0;
  return png;
}

function setPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const idx = (SIZE * y + x) << 2;
  png.data[idx] = color.r;
  png.data[idx + 1] = color.g;
  png.data[idx + 2] = color.b;
  png.data[idx + 3] = color.a;
}

function fillRect(png, x0, y0, w, h, color) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) setPixel(png, x, y, color);
  }
}

function strokeRect(png, x0, y0, w, h, t, color) {
  fillRect(png, x0, y0, w, t, color);
  fillRect(png, x0, y0 + h - t, w, t, color);
  fillRect(png, x0, y0, t, h, color);
  fillRect(png, x0 + w - t, y0, t, h, color);
}

function drawLine(png, x0, y0, x1, y1, t, color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / steps);
    const y = Math.round(y0 + ((y1 - y0) * i) / steps);
    fillRect(png, x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, color);
  }
}

function drawShop(png, color) {
  strokeRect(png, 10, 18, 28, 22, T, color);
  drawLine(png, 14, 18, 14, 12, T, color);
  drawLine(png, 34, 18, 34, 12, T, color);
  drawLine(png, 14, 12, 34, 12, T, color);
}

function drawGift(png, color) {
  strokeRect(png, 12, 20, 24, 18, T, color);
  drawLine(png, 24, 20, 24, 12, T, color);
  drawLine(png, 12, 26, 36, 26, T, color);
  drawLine(png, 18, 12, 24, 18, T, color);
  drawLine(png, 30, 12, 24, 18, T, color);
}

function drawShopping(png, color) {
  strokeRect(png, 12, 18, 24, 20, T, color);
  drawLine(png, 16, 18, 16, 12, T, color);
  drawLine(png, 32, 18, 32, 12, T, color);
  drawLine(png, 16, 12, 32, 12, T, color);
}

function drawCamera(png, color) {
  strokeRect(png, 8, 16, 32, 22, T, color);
  fillRect(png, 18, 12, 12, 6, color);
  fillRect(png, 20, 24, 8, 8, { r: 255, g: 255, b: 255, a: 255 });
}

function drawLightning(png, color) {
  drawLine(png, 26, 8, 18, 24, T, color);
  drawLine(png, 18, 24, 24, 24, T, color);
  drawLine(png, 24, 24, 20, 38, T, color);
  drawLine(png, 20, 38, 30, 20, T, color);
  drawLine(png, 30, 20, 24, 20, T, color);
  drawLine(png, 24, 20, 26, 8, T, color);
}

function drawArrowRight(png, color) {
  drawLine(png, 16, 24, 30, 24, T, color);
  drawLine(png, 24, 18, 30, 24, T, color);
  drawLine(png, 24, 30, 30, 24, T, color);
}

function drawArrowDown(png, color) {
  drawLine(png, 24, 16, 24, 30, T, color);
  drawLine(png, 18, 24, 24, 30, T, color);
  drawLine(png, 30, 24, 24, 30, T, color);
}

const ICONS = {
  shop: drawShop,
  gift: drawGift,
  shopping: drawShopping,
  camera: drawCamera,
  lightning: drawLightning,
  'arrow-right': drawArrowRight,
  'arrow-down': (png) => drawArrowDown(png, MUTED),
};

fs.mkdirSync(dir, { recursive: true });
Object.entries(ICONS).forEach(([name, draw]) => {
  const png = createCanvas();
  draw(png, COLOR);
  fs.writeFileSync(path.join(dir, `${name}.png`), PNG.sync.write(png));
});

console.log('Menu icons generated.');
