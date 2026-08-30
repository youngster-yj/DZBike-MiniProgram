/**
 * 生成商品菜单区分图标（与 tabbar 同款线框 + #3182ce）。
 * brands.png：九宫格；equip.png：头盔轮廓。
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const SIZE = 81;
const dir = path.join(__dirname, '..', 'src', 'assets', 'menu');
const COLOR = { r: 49, g: 130, b: 206, a: 255 };
const T = 4;

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

/** 九宫格：其余品牌大类 */
function drawBrands(png, color) {
  const cells = [
    [18, 18],
    [34, 18],
    [50, 18],
    [18, 34],
    [34, 34],
    [50, 34],
    [18, 50],
    [34, 50],
    [50, 50],
  ];
  const cell = 12;
  cells.forEach(([x, y]) => strokeRect(png, x, y, cell, cell, 3, color));
}

/** 头盔：骑行装备 */
function drawEquip(png, color) {
  // dome
  for (let a = 200; a <= 340; a += 2) {
    const rad = (a * Math.PI) / 180;
    const x = Math.round(40 + 22 * Math.cos(rad));
    const y = Math.round(38 + 20 * Math.sin(rad));
    fillRect(png, x - 1, y - 1, T, T, color);
  }
  // brim / visor line
  drawLine(png, 18, 42, 62, 42, T, color);
  // cheek / lower shell
  drawLine(png, 22, 42, 22, 54, T, color);
  drawLine(png, 58, 42, 58, 54, T, color);
  drawLine(png, 22, 54, 58, 54, T, color);
  // vent
  drawLine(png, 34, 26, 46, 26, 3, color);
}

function writeIcon(filename, draw) {
  const png = createCanvas();
  draw(png, COLOR);
  fs.writeFileSync(path.join(dir, filename), PNG.sync.write(png));
}

fs.mkdirSync(dir, { recursive: true });
writeIcon('brands.png', drawBrands);
writeIcon('equip.png', drawEquip);
console.log('Menu icons generated: brands.png, equip.png');
