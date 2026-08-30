# DZBike 微信小程序

达州自行车俱乐部 C 端微信小程序，基于 Taro 4 + React + TypeScript，对接现有 [DZBike-Server](https://github.com) REST API。

## 功能

- 首页：轮播、门店、品牌、分类、活动预览
- 商品：品牌/分类浏览、搜索、详情
- 活动：骑行活动报名、店铺活动、精彩日常
- 投诉：投诉提交
- 地图：门店导航

## 开发

### 环境要求

- Node.js >= 18
- 微信开发者工具

### 安装

```bash
cd F:\github-work\DZBike-MiniProgram
npm install
```

`postinstall` 会自动执行：修补 `@tarojs/components` 导出、生成 TabBar 占位图标。

> 若本机 npm 配置了 `omit=dev`，需确保 devDependencies 已安装（项目根目录已添加 `.npmrc` 的 `include=dev`）。

### 本地开发

1. 启动后端（默认 `http://localhost:3001`）

```bash
cd F:\github-work\DZBike-Server
npm start
```

2. 编译小程序

```bash
npm run dev:weapp
```

3. 用微信开发者工具**导入项目**，目录选择 **`dist/`**（推荐）

   - `dist/project.config.json` 的 `miniprogramRoot` 为 `./`，与 Taro 编译产物一致
   - 每次 `npm run build:weapp` 会自动同步 `dist/project.private.config.json`（含 `ignoreDevUnusedFiles: false`）
   - 若改为打开**项目根目录**（`miniprogramRoot: dist/`），需确保根目录 `project.private.config.json` 中 `ignoreDevUnusedFiles` 为 `false`，否则可能出现全 Tab 白屏
   - **调试基础库**建议使用 **3.6.x**（已在私有配置中固定为 `3.6.3`）；不建议使用 3.17+，易触发 `appLaunch with non-empty page stack` 导致白屏

4. 修改配置或首次打开后：**工具 → 清缓存 → 全部清除 → 重新编译**

5. 开发阶段勾选：**详情 → 本地设置 → 不校验合法域名、web-view、TLS 版本以及 HTTPS 证书**

### 白屏排查

若导航栏/TabBar 正常但内容区全白：

1. **工具 → 清缓存 → 全部清除**，重新编译
2. 确认 **`ignoreDevUnusedFiles: false`**（根目录或 `dist/project.private.config.json`）
3. **详情 → 本地设置 → 调试基础库** 选 **3.6.x**（勿用 3.17+）
4. 重新编译：`npm run build:weapp`（会自动 sync 私有配置到 dist）
5. watch 模式下若首次打开 dist 白屏，可手动执行：`npm run sync:devtools`

### 生产构建

```bash
npm run build:weapp:prod
```

## 微信小程序配置清单

### 1. AppID

在 [微信公众平台](https://mp.weixin.qq.com/) 注册小程序，获取 AppID，填入：

- `project.config.json` → `appid`

当前默认为 `touristappid`（游客模式，仅本地调试）。

### 2. 服务器域名

**开发管理 → 开发设置 → 服务器域名**

| 类型 | 域名 |
|------|------|
| request 合法域名 | `https://dzbike.club` |
| uploadFile 合法域名 | `https://dzbike.club` |
| downloadFile 合法域名 | `https://dzbike.club` |

静态资源图片通过 `https://dzbike.club/assets/...` 加载。

### 3. 隐私协议

小程序使用了以下能力，需在公众平台配置用户隐私保护指引：

- `getLocation`：门店地图导航
- 可选 `chooseLocation`：地图选点

### 4. 类目建议

- 体育 → 体育用品
- 或 生活服务 → 俱乐部/休闲

### 5. 环境变量

| 变量 | 开发 | 生产 |
|------|------|------|
| `TARO_APP_API_BASE` | `http://localhost:3001/dz-bike/` | `https://dzbike.club/dz-bike/` |
| `TARO_APP_ASSET_BASE` | `http://localhost:3001/` | `https://dzbike.club/` |
| `TARO_APP_WX_SUBSCRIBE_ACTIVITY_AUDIT` | 审核结果模板 ID（可空） | 同左 |
| `TARO_APP_WX_SUBSCRIBE_BIKE_REMIND` | 骑行开始前提醒模板 ID | 同左 |
| `TARO_APP_WX_SUBSCRIBE_SHOP_REMIND` | 店铺截止前提醒模板 ID | 同左 |

配置位于 `config/dev.ts` 和 `config/prod.ts`。提醒模板为「活动预约提醒」：`thing2` / `thing4` / `time8`；服务端对应 `WX_SUBSCRIBE_TEMPLATE_*`。

## 项目结构

```
src/
├── pages/          # 页面
├── components/     # 公共组件
├── services/       # API 与平台配置
├── store/          # Zustand 状态
├── data/           # 品牌/分类默认配置
└── utils/          # 工具函数
```

## 与 Web 端关系

- **Web 端 (DZBike-Client)**：保留完整 admin 后台
- **小程序**：仅 C 端公开功能
- **后端 (DZBike-Server)**：MVP 阶段无需改动，复用现有公开 API

## 真机联调

1. 微信开发者工具 → 预览 → 扫码
2. 确认 API 域名已在公众平台配置（生产环境）
3. 验证：首页加载、商品列表、活动报名、投诉提交、地图导航

## 提交审核

1. `npm run build:weapp`
2. 微信开发者工具 → 上传
3. 公众平台 → 版本管理 → 提交审核
4. 准备审核说明：自行车俱乐部商品展示与活动报名，无支付功能
