/**
 * 将根目录 project.private.config.json 同步到 dist/，
 * 避免直接打开 dist/ 时 DevTools 默认 ignoreDevUnusedFiles=true 导致全 Tab 白屏。
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'project.private.config.json');
const distDir = path.join(root, 'dist');
const dest = path.join(distDir, 'project.private.config.json');

if (!fs.existsSync(src)) {
  console.warn('sync-devtools-config: project.private.config.json not found, skip.');
  process.exit(0);
}

if (!fs.existsSync(distDir)) {
  console.warn('sync-devtools-config: dist/ not found, skip (run build first).');
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(src, 'utf8'));
config.setting = {
  ...config.setting,
  ignoreDevUnusedFiles: false,
  compileHotReLoad: false,
  minified: false,
  showShadowRootInWxmlPanel: true,
};

fs.writeFileSync(dest, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log('Synced project.private.config.json -> dist/project.private.config.json');
