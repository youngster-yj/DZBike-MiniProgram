/**
 * Taro 4 默认从 dist 导出 H5 组件。小程序构建需改指向 mini，
 * 否则运行时会白屏。postinstall 会自动执行本脚本。
 */
const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'node_modules', '@tarojs', 'components');
const distIndex = path.join(componentsDir, 'dist', 'index.js');
const esmIndex = path.join(componentsDir, 'dist', 'esm', 'index.js');
const patch = "export * from '../../mini/index.js';\n";

if (fs.existsSync(componentsDir)) {
  fs.writeFileSync(distIndex, patch);
  fs.writeFileSync(esmIndex, patch);
  console.log('Patched @tarojs/components exports for mini program build.');
}
