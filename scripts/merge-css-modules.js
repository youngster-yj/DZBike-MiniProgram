/**
 * 一次性把 *.module.css 合并进 app.css，并把 TSX 里的 styles.xxx 改成带前缀的 className。
 * 正则必须只匹配类选择器，不能匹配 0.85 / 1.6 这类小数（旧正则会把它们污染成 0.home-index-85）。
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const appCssPath = path.join(srcDir, 'app.css');
let appCss = fs.readFileSync(appCssPath, 'utf8');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.module.css')) files.push(full);
  }
  return files;
}

function prefixCss(content, prefix) {
  // 只匹配「空白/{/;/,/>/+/~ 之后的 .class」，避开 rgba(0, 0, 0, 0.85) 里的小数点
  return content.replace(
    /(^|[\s{,>+~])(\.)([a-zA-Z_-][a-zA-Z0-9_-]*)/g,
    (_, before, dot, cls) => `${before}${dot}${prefix}-${cls}`,
  );
}

const cssFiles = walk(srcDir);

for (const cssFile of cssFiles) {
  const rel = path.relative(srcDir, cssFile).replace(/\\/g, '/');
  const prefix = rel
    .replace(/\.module\.css$/, '')
    .replace(/\//g, '-')
    .replace(/pages-/, '')
    .replace(/components-/, '');

  const raw = fs.readFileSync(cssFile, 'utf8');
  appCss += `\n/* ${rel} */\n${prefixCss(raw, prefix)}\n`;

  const tsxCandidates = [
    cssFile.replace('.module.css', '.tsx'),
    path.join(path.dirname(cssFile), 'index.tsx'),
  ];

  for (const tsxFile of tsxCandidates) {
    if (!fs.existsSync(tsxFile)) continue;
    let tsx = fs.readFileSync(tsxFile, 'utf8');
    if (!tsx.includes('.module.css')) continue;

    tsx = tsx.replace(/import styles from ['"].*\.module\.css['"];\n?/g, '');
    tsx = tsx.replace(/styles\.([a-zA-Z0-9_-]+)/g, (_, cls) => `"${prefix}-${cls}"`);
    tsx = tsx.replace(/className=\{(`[^`]+`)\}/g, 'className={$1}');
    fs.writeFileSync(tsxFile, tsx, 'utf8');
    break;
  }

  fs.unlinkSync(cssFile);
}

fs.writeFileSync(appCssPath, appCss, 'utf8');
console.log(`Merged ${cssFiles.length} module css files into app.css`);
