# PromptVault 上线操作指南（小白版）

> 域名：`getpt.net`（已在 Cloudflare 购买）
> 按顺序做完以下 5 步，网站就能跑起来。

---

## 第 1 步：注册 Supabase（免费数据库）

1. 打开 https://supabase.com ，点 "Start your project"，用 GitHub 账号登录
2. 点 "New Project"：
   - **Organization**：选默认或新建一个
   - **Project name**：填 `promptvault`
   - **Database Password**：设一个密码，**记下来**
   - **Region**：选 `Southeast Asia (Singapore)` 或 `US East` 都行
   - 点 "Create new project"，等 1-2 分钟创建完成
3. 创建完成后，进入项目页面，点左侧 **Settings** → **Database**：
   - 找到 **Connection string** → **URI** 那一行
   - 复制下来，把 `[YOUR-PASSWORD]` 替换成你刚才设的密码
   - 这就是你的 `DATABASE_URL`

**你需要记下的东西**：
```
DATABASE_URL = postgresql://postgres.xxxxx:密码@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

---

## 第 2 步：创建 Cloudflare R2 存储桶（存图片/视频）

你已经有 Cloudflare 账号了（买域名的那个），直接操作：

1. 登录 https://dash.cloudflare.com
2. 左侧菜单点 **R2 Object Storage**
3. 如果是第一次用，需要绑定支付方式（免费额度 10GB，不会扣费）
4. 点 **Create bucket**：
   - **Bucket name**：填 `promptvault-media`
   - **Location**：选 Automatic 或 APAC
   - 点 "Create bucket"
5. 创建好后，进入这个 bucket，点上方 **Settings** 标签：
   - 找到 **Custom Domains**，点 "Connect Domain"
   - 输入 `cdn.getpt.net`，点 Connect
   - Cloudflare 会自动配置 DNS，等几分钟生效
6. 创建 API Token：
   - 回到 R2 主页面，点右侧 **Manage R2 API Tokens**
   - 点 "Create API token"
   - **Permissions**：选 "Object Read & Write"
   - **Specify bucket**：选 `promptvault-media`
   - 点 "Create API Token"
   - **重要！只显示一次**，把这三样复制保存下来：
     - Access Key ID
     - Secret Access Key
     - 页面顶部会显示你的 Account ID

**你需要记下的东西**：
```
R2_ACCOUNT_ID = 你的 Cloudflare Account ID
R2_ACCESS_KEY_ID = 刚生成的 Access Key
R2_SECRET_ACCESS_KEY = 刚生成的 Secret Key
R2_BUCKET_NAME = promptvault-media
R2_PUBLIC_URL = https://cdn.getpt.net
```

---

## 第 3 步：注册 Vercel（部署网站，免费）

1. 打开 https://vercel.com ，用 GitHub 账号登录
2. 先把代码推到 GitHub：
   - 在 GitHub 上新建一个仓库（Repository），名字叫 `promptvault`，选 **Private**
   - 然后在你电脑的 `d:\cursor\promptvault` 目录下执行：
   
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/promptvault.git
   git push -u origin main
   ```

3. 回到 Vercel 网站，点 **Add New** → **Project**
4. 选择 **Import Git Repository**，找到 `promptvault` 仓库，点 Import
5. 配置页面：
   - **Framework Preset**：应该自动识别为 Astro（如果没有就手动选 Astro）
   - **Root Directory**：留空（默认）
   - 展开 **Environment Variables**，把下面的变量一个个加进去（就是你前面记下来的那些）：

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | 你的 Supabase 连接字符串 |
   | `R2_ACCOUNT_ID` | Cloudflare Account ID |
   | `R2_ACCESS_KEY_ID` | R2 Access Key |
   | `R2_SECRET_ACCESS_KEY` | R2 Secret Key |
   | `R2_BUCKET_NAME` | promptvault-media |
   | `R2_PUBLIC_URL` | https://cdn.getpt.net |

6. 点 **Deploy**，等 2-3 分钟构建完成
7. 部署成功后，Vercel 会给你一个临时地址（如 `promptvault-xxx.vercel.app`），先用这个测试

---

## 第 4 步：绑定域名 getpt.net

### 4.1 在 Vercel 添加域名

1. 在 Vercel 项目页面，点 **Settings** → **Domains**
2. 输入 `getpt.net`，点 Add
3. Vercel 会告诉你需要配置 DNS，一般显示：
   - 类型 `A`，值 `76.76.21.21`
   - 或者类型 `CNAME`，值 `cname.vercel-dns.com`

### 4.2 在 Cloudflare 配置 DNS

1. 登录 Cloudflare Dashboard，选择 `getpt.net` 域名
2. 点左侧 **DNS** → **Records**
3. 添加记录：

   | Type | Name | Content | Proxy |
   |------|------|---------|-------|
   | `A` | `@` | `76.76.21.21` | **关闭**（灰色云朵） |
   | `CNAME` | `www` | `cname.vercel-dns.com` | **关闭**（灰色云朵） |

   > **重要**：Proxy 必须关闭（灰色云朵），因为 Vercel 自带 SSL

4. 等 5-10 分钟 DNS 生效
5. 打开 `https://getpt.net` 验证

### 4.3 SSL 证书

- Vercel 自动配置 SSL 证书，你不需要做任何操作
- `cdn.getpt.net`（R2）由 Cloudflare 自动处理 SSL

---

## 第 5 步：初始化数据库 & 导入种子数据

在你的电脑上操作（只需要做一次）：

1. 先创建本地的 `.env` 文件：
   - 复制 `.env.example` 为 `.env`
   - 填入你在前面记下的所有值

2. 打开终端（在 `d:\cursor\promptvault` 目录下），执行：

   ```bash
   # 把表结构推到数据库
   pnpm db:push

   # 导入示例数据（8 个模型 + 16 个标签 + 8 条提示词）
   pnpm db:seed
   ```

3. 如果看到 `Done!` 说明成功了

4. 刷新 `https://getpt.net`，应该能看到内容了

---

## 完成后你可以做什么

| 页面 | 地址 | 说明 |
|------|------|------|
| 首页 | https://getpt.net | Landing Page |
| 画廊 | https://getpt.net/gallery | 浏览所有提示词 |
| 详情 | https://getpt.net/prompt/cyberpunk-city-at-sunset | 查看单条提示词 |
| 搜索 | https://getpt.net/search?q=cyberpunk | 搜索 |
| 后台 | https://getpt.net/admin | 管理内容 |
| 新建内容 | https://getpt.net/admin/content | 添加新提示词 |

---

## 后续添加新内容的流程

1. 打开 `https://getpt.net/admin/content`
2. 点 "+ New Prompt" 展开表单
3. 填写：Title、选 Model、输入 Prompt、填参数
4. 上传图片/视频
5. Status 选 "Published"
6. 点 Save

---

## 费用总结

| 项目 | 费用 |
|------|------|
| 域名 getpt.net | ~$10/年（已付） |
| Supabase | $0（免费 500MB） |
| Cloudflare R2 | $0（免费 10GB） |
| Vercel | $0（免费版） |
| **合计** | **~$0.8/月**（仅域名均摊） |

---

## 遇到问题怎么办

| 现象 | 原因 | 解决方法 |
|------|------|----------|
| 页面白屏 | 环境变量没配 | 检查 Vercel 的 Environment Variables 是否都填了 |
| 数据库连接失败 | DATABASE_URL 不对 | 去 Supabase Settings → Database 重新复制 URI |
| 图片上不去 | R2 配置不对 | 检查 R2 API Token 权限是否选了 Read & Write |
| 域名打不开 | DNS 还没生效 | 等 10-30 分钟再试；检查 Cloudflare DNS 记录 |
| `pnpm db:push` 报错 | .env 文件没填 | 确保 .env 里的 DATABASE_URL 已经填了真实值 |
| Vercel 构建失败 | 依赖版本问题 | 在 Vercel Settings → General 里把 Node.js 版本设为 20.x |
