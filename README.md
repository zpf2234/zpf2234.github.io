# boki 的技术站

一个基于 **Hexo + Fluid** 的个人技术博客。文章使用 Markdown 编写，主题通过 Fluid 配置和自定义 CSS/JS 调整。

## 公开素材

- `assets/anime-girl.jpg`：Niabot，Wikimedia Commons，CC BY-SA 3.0。来源：[Anime Girl upright version](https://commons.wikimedia.org/wiki/File:Anime_Girl_upright_version.jpg)
- `assets/night-sky.jpg`：Arnaud Vergnet，Wikimedia Commons，CC0。来源：[Cévennes France night sky with stars 01](https://commons.wikimedia.org/wiki/File:C%C3%A9vennes_France_night_sky_with_stars_01.jpg)

## 本地预览

```powershell
npm install
npm run server
```

访问 <http://localhost:4000>。

构建静态文件：

```powershell
npm run build
```

生成结果在 `public/`。

## GitHub Pages 部署

1. 将本目录推送到 GitHub 仓库的 `main` 分支。
2. 在仓库设置中启用 Pages，Source 选择 `GitHub Actions`。
3. `.github/workflows/pages.yml` 会运行 `npm ci`、`npm run build`，再发布 `public/`。

## 内容修改

- 站点配置：`_config.yml`
- Fluid 主题配置：`_config.fluid.yml`
- 文章：`source/_posts/`
- 自定义视觉：`source/css/blog-custom.css`
- 自定义交互：`source/js/site-enhance.js`
- 首页图片：`source/img/`
- 首页背景和角色图都已下载到 `assets/`，部署时不依赖外部热链。

## 当前素材分工

- `source/img/orihime-main.jpg`：首页主 Banner
- `source/img/orihime-avatar.jpg`：从主图裁出的头像
- `source/img/orihime-flowers.jpg`：首页右侧小卡和文章页 Banner
- `source/img/orihime-red-silhouette.jpg`：404 页面背景
- `source/img/covers/bleach-poster.jpg`：默认文章封面
- `source/img/covers/red-scene.jpg`、`red-closeup.jpg`、`light-closeup.jpg`：其他文章封面

这些图片由站点维护者提供，部署前请确认自己的公开使用范围和图片来源说明。
