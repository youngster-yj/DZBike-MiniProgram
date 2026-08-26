/**
 * 门店操作图标：描边风格，对齐 Web Ant Design Outlined（#3182ce）。
 * 顺序：电话 | 微信 | 地图
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const SIZE = 48;
const dir = path.join(__dirname, '..', 'src', 'assets', 'icons');
const COLOR = { r: 49, g: 130, b: 206, a: 255 };
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

function strokeCircle(png, cx, cy, r, t, color) {
  for (let y = cy - r - t; y <= cy + r + t; y++) {
    for (let x = cx - r - t; x <= cx + r + t; x++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (d >= r - t / 2 && d <= r + t / 2) setPixel(png, x, y, color);
    }
  }
}

function drawLine(png, x0, y0, x1, y1, t, color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / steps);
    const y = Math.round(y0 + ((y1 - y0) * i) / steps);
    fillRect(png, x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, color);
  }
}

/** PhoneOutlined：听筒描边 */
function drawPhone(png, color) {
  strokeRect(png, 18, 10, 12, 22, T, color);
  fillRect(png, 21, 28, 6, 3, color);
  fillRect(png, 20, 30, 8, 2, color);
}

/** WechatOutlined：双气泡描边 */
function drawMessage(png, color) {
  strokeRect(png, 8, 14, 20, 14, T, color);
  fillRect(png, 10, 26, 4, 4, color);
  fillRect(png, 8, 28, 3, 3, color);
  strokeRect(png, 20, 10, 20, 14, T, color);
  fillCircleDots(png, 26, 17, color);
}

function fillCircleDots(png, cx, cy, color) {
  [[-4, 0], [0, 0], [4, 0]].forEach(([dx]) => {
    for (let y = cy - 1; y <= cy + 1; y++) {
      for (let x = cx + dx - 1; x <= cx + dx + 1; x++) {
        setPixel(png, x, y, color);
      }
    }
  });
}

/** EnvironmentOutlined：定位针描边 */
function drawLocation(png, color) {
  strokeCircle(png, 24, 16, 8, T, color);
  fillRect(png, 22, 22, 4, 10, color);
  fillRect(png, 18, 30, 12, 3, color);
  fillRect(png, 20, 32, 8, 2, color);
  setPixel(png, 24, 16, color);
}

const ICONS = {
  phone: drawPhone,
  message: drawMessage,
  location: drawLocation,
};

fs.mkdirSync(dir, { recursive: true });
Object.entries(ICONS).forEach(([name, draw]) => {
  const png = createCanvas();
  draw(png, COLOR);
  fs.writeFileSync(path.join(dir, `${name}.png`), PNG.sync.write(png));
});

console.log('Action icons generated.');
