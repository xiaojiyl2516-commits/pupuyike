# 浦浦荐逼 - Telegram Mini App

## 📱 项目介绍

一个 Telegram Mini App（电报小程序），以 Netflix 流媒体风格展示成都楼凤老师名片。
完全前端实现，无需服务器即可运行，数据存储在浏览器本地。

## 🎯 功能清单

### 前台展示 (index.html)
✅ Netflix风格卡片式展示老师名片
✅ 照片左右滑切换（最多10张）
✅ 按区域筛选（锦江、青羊、成华、武侯、金牛、高新）
✅ 按标签筛选（御姐、嫩妹、少妇、BBW等，支持自定义）
✅ 按价格区间筛选
✅ 按开课状态筛选
✅ 搜索（花名、TG账号、标签、简介）
✅ 老师详情弹窗（含完整信息、照片轮播、评价）
✅ 用户添加评价（星级评分 + 文字评价）
✅ 签到更新开课状态
✅ 触屏滑动切换照片
✅ 响应式设计（手机/平板/桌面）

### 管理后台 (admin.html)
✅ 添加 / 编辑 / 删除老师
✅ 切换老师开课状态
✅ 管理照片链接（最多10张）
✅ 自定义标签
✅ 数据导出（JSON文件下载）
✅ 数据导入（粘贴JSON恢复数据）

## 📁 文件结构

```
telegram-miniapp/
├── index.html      # 前台展示页面（主入口）
├── admin.html      # 管理后台页面
├── styles.css      # 全局样式（Netflix暗色主题）
├── app.js          # 前台主逻辑
├── admin.js        # 管理后台逻辑
└── README.md       # 本说明文档
```

## 🚀 如何部署上线

### 方式一：GitHub Pages（推荐，免费）

1. **注册/登录 GitHub** → 创建新仓库（public）
2. 将以上文件上传到仓库
3. 进入仓库 **Settings → Pages**
4. Source 选 **Deploy from a branch** → branch 选 **main** → folder 选 **/(root)**
5. 等待几分钟，访问 https://你的用户名.github.io/仓库名/ 即可看到效果

### 方式二：Vercel（更快，免费）

1. 注册 Vercel.com（用 GitHub 登录）
2. 点击 **New Project** → 导入你的 GitHub 仓库
3. 不需要改任何设置，直接 Deploy
4. 自动获得 https://项目名.vercel.app 域名

> ⚠️ 注意：因为照片用了 picsum.photos 的随机占位图，你需要**替换成真实照片链接**。
> 照片可以上传到免费图床（如 imgur.com、sm.ms），然后复制图片URL填入。

## 🤖 接入 Telegram Bot

要让这个小程序在 Telegram 内打开，需要：

### 步骤1：创建 Bot
1. 在 Telegram 搜索 **@BotFather**
2. 发送 `/newbot`
3. 给 bot 起名（如 `浦浦荐逼`）
4. 获取 **Token**（形如 `123456:ABC-DEF1234gh...`）

### 步骤2：设置 Mini App
1. 向 @BotFather 发送 `/mybots` → 选择你的 bot
2. 点击 **Bot Settings** → **Menu Button** → 输入你的网页地址
   - 例如：`https://你的用户名.github.io/仓库名/`
3. 或者发送 `/setdomain` 设置域名

### 步骤3：设置 Bot 命令
向 @BotFather 发送：
```
/setcommands
```
然后粘贴：
```
start - 打开浦浦荐逼
search - 搜索老师
checkin - 签到更新状态
```

### 步骤4：在 Telegram 内打开
点击 bot → 点击底部的 **Menu Button**（或发送 /start）
Mini App 将在 Telegram 内全屏打开。

## 📝 数据管理说明

### 默认示例数据
首次打开时，系统会加载 6 位示例老师的数据（使用 picsum.photos 的随机占位照片）。

### 替换为真实数据
1. 打开 `admin.html` 管理后台
2. 编辑每位老师，替换照片链接为真实照片
3. 或者导出JSON → 批量编辑 → 导入

### 数据存储
- 数据保存在浏览器 **localStorage** 中
- 更换手机或清空浏览器缓存会丢失数据
- 建议定期在管理后台**导出数据**备份

## 🛠️ 进阶：添加后端持久化

当你需要多设备同步数据时，可以添加一个简单的后端：

### 方案：使用 LeanCloud（免费）
1. 注册 leancloud.app
2. 创建应用 → 获取 AppID 和 AppKey
3. 在 app.js 中替换 localStorage 为 LeanCloud API 调用
4. 代码约 30 行即可实现云端数据存储

## 💡 自定义照片

### 推荐免费图床
| 网站 | 特点 |
|------|------|
| imgur.com | 最稳定，无需注册可传 |
| sm.ms | 国内访问快 |
| imgbb.com | 上传简单 |

### 照片建议
- 尺寸：正方形 1:1 最佳（如 400x400 或 800x800）
- 格式：JPG 或 WebP
- 大小：每张不超过 500KB
- 数量：每人 3-6 张最佳

## ⚠️ 注意事项

1. **法律风险**：请确保内容符合当地法律法规
2. **隐私保护**：建议不要展示真实姓名、联系方式等隐私信息
3. **照片版权**：请使用已获得授权的照片
4. **数据安全**：localStorage 仅在本地存储，不会上传到任何服务器
5. **Mini App 限制**：Telegram 要求 Mini App 使用 HTTPS 协议

---

> 如有问题，可在管理后台导出数据后提问，或查看 app.js 中的代码注释。
