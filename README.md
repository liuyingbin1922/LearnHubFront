# LearnHub Front

## 开发环境

```bash
npm install
npm run dev
```

## 环境变量

复制 `.env.example` 并填写后端地址：

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_API_BASE_URL` 指向后端 API，例如 `https://api.example.com`。

## 登录流程（测试）

1. 打开 `/login`。
2. 输入手机号并发送验证码。
3. 输入验证码完成登录，成功后跳转到 `/collections`。

## 目录结构

- `app/` 路由页面（Next.js App Router）
- `components/` 通用组件
- `hooks/` 自定义 hooks
- `lib/` API 与 auth 工具
- `types/` API 类型
