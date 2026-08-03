# NEBULA ▸ 星云图库

科幻风格的 **云端图床** 网页。上传的图片通过 **Cloudinary** 存储在云端，生成公开可访问的 CDN 链接。

## 功能
- 📤 拖拽 / 点击上传图片（支持多张：PNG / JPG / GIF / WebP）
- ☁️ 图片上传至 **Cloudinary 云服务器**，所有人可访问（25GB 免费存储）
- 🔒 使用 **unsigned upload preset** 认证，纯前端安全上传，不泄露密钥
- 🖼️ 科幻卡片网格展示，点击放大预览
- 🗑️ 从列表中移除 / 一键清空

## 配置
在 `app.js` 顶部修改：

```js
const CLOUD_NAME = 'xdg5jjqx';       // 你的 Cloudinary Cloud Name
const UPLOAD_PRESET = 'github-web';  // 你的 unsigned upload preset
```

## 说明
- Cloudinary **unsigned preset** 需在 Cloudinary 后台创建：Settings → Upload → Upload presets → Add → Signing Mode 选 **Unsigned**
- 图片本身永久存在云端；页面上的**影像列表**（URL 清单）保存在各访客浏览器本地 localStorage，便于你自己管理。

## 部署
部署到 GitHub Pages（或任意静态托管）即可在线访问。
