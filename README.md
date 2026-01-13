# LearnHub Front

## 开发环境

```bash
npm install
npm run dev
```

## 环境变量

复制 `.env.example` 并填写后端地址与登录配置：

```bash
cp .env.example .env.local
```

主要配置：

- `NEXT_PUBLIC_API_BASE_URL` 后端 API 地址
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` Google OAuth Client ID
- `NEXT_PUBLIC_AUTH_MODE` `token`（GIS）或 `redirect`（后端重定向）
- `NEXT_PUBLIC_DEFAULT_LOCALE` 默认语言
- `NEXT_PUBLIC_DEFAULT_REGION` 默认区域

## 语言与路由

- 语言路由使用 `/en` 与 `/zh` 前缀。
- 示例：`/en/login`、`/zh/collections`。

## 登录流程（测试）

1. 打开 `/en/login` 或 `/zh/login`。
2. Global 选择 Google 登录；CN 选择微信或手机号 OTP。
3. 登录成功后跳转到 `/{locale}/collections`。

## 目录结构

- `app/` 路由页面（Next.js App Router）
- `components/` 通用组件
- `hooks/` 自定义 hooks
- `lib/` API 与 auth 工具
- `types/` API 类型
- `messages/` i18n 文案
