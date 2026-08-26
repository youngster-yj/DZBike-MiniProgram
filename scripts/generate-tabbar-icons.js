/**
 * 生成 TabBar 图标 PNG（81×81，线框描边风格）。
 * 传 --force 或删除旧文件后强制覆盖。
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const SIZE = 81;
const FORCE = process.argv.includes('--force');
const dir = path.join(__dirname, '..', 'src', 'assets', 'tabbar');

const COLORS = {
  inactive: { r: 148, g: 163, b: 184, a: 255 },
  active: { r: 49, g: 130, b: 206, a: 255 },
};

function createCanvas() {
  const png = new PNG({ width: SIZE, height: SIZE });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i + 3] = 0;
  }
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
    for (let x = x0; x < x0 + w; x++) {
      setPixel(png, x, y, color);
    }
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

const T = 4;

function drawHome(png, color) {
  drawLine(png, 40, 18, 22, 34, T, color);
  drawLine(png, 40, 18, 58, 34, T, color);
  strokeRect(png, 22, 34, 36, 26, T, color);
  strokeRect(png, 34, 46, 12, 14, T, color);
}

function drawShopping(png, color) {
  drawLine(png, 28, 26, 28, 20, T, color);
  drawLine(png, 52, 26, 52, 20, T, color);
  drawLine(png, 28, 20, 52, 20, T, color);
  strokeRect(png, 24, 26, 32, 28, T, color);
  drawLine(png, 30, 38, 50, 38, T, color);
}

function drawActivity(png, color) {
  drawLine(png, 46, 16, 34, 40, T, color);
  drawLine(png, 34, 40, 44, 40, T, color);
  drawLine(png, 44, 40, 38, 58, T, color);
  drawLine(png, 38, 58, 52, 34, T, color);
  drawLine(png, 52, 34, 42, 34, T, color);
  drawLine(png, 42, 34, 46, 16, T, color);
}

function drawComplaint(png, color) {
  drawLine(png, 40, 18, 40, 14, T, color);
  strokeRect(png, 26, 22, 28, 24, T, color);
  drawLine(png, 22, 30, 18, 34, T, color);
  drawLine(png, 58, 30, 62, 34, T, color);
  fillRect(png, 36, 50, 8, 6, color);
  strokeRect(png, 32, 56, 16, 6, T, color);
}

const ICONS = {
  home: drawHome,
  goods: drawShopping,
  activity: drawActivity,
  complaint: drawComplaint,
};

function renderIcon(name, active) {
  const png = createCanvas();
  ICONS[name](png, active ? COLORS.active : COLORS.inactive);
  return PNG.sync.write(png);
}

function ensureIcon(filename, name, active) {
  const target = path.join(dir, filename);
  if (!FORCE && fs.existsSync(target) && fs.statSync(target).size > 400) {
    return;
  }
  fs.writeFileSync(target, renderIcon(name, active));
}

fs.mkdirSync(dir, { recursive: true });

ensureIcon('home.png', 'home', false);
ensureIcon('home-active.png', 'home', true);
ensureIcon('goods.png', 'goods', false);
ensureIcon('goods-active.png', 'goods', true);
ensureIcon('activity.png', 'activity', false);
ensureIcon('activity-active.png', 'activity', true);
ensureIcon('complaint.png', 'complaint', false);
ensureIcon('complaint-active.png', 'complaint', true);

console.log('Tab bar icons generated.');
