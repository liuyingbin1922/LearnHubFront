# Better Auth 集成方案

## 目录

- [一、概述](#一概述)
- [二、技术选型](#二技术选型)
- [三、服务端配置](#三服务端配置)
- [四、客户端配置](#四客户端配置)
- [五、Google OAuth 配置](#五google-oauth-配置)
- [六、环境变量配置](#六环境变量配置)
- [七、会话管理](#七会话管理)
- [八、路由保护](#八路由保护)
- [九、数据库集成](#九数据库集成)
- [十、与现有项目集成](#十与现有项目集成)
- [十一、常见问题](#十一常见问题)
- [十二、后续扩展](#十二后续扩展)

---

## 一、概述

### 1.1 为什么选择 Better Auth

Better Auth 是一个框架无关的 TypeScript 认证和授权库，具有以下优势：

| 特性 | 说明 |
|------|------|
| **框架无关** | 支持 Next.js、Express、Hono 等多种框架 |
| **类型安全** | 完整的 TypeScript 支持 |
| **社交登录** | 内置 Google、GitHub、Facebook 等主流社交登录 |
| **会话管理** | 支持有状态和无状态会话 |
| **插件生态** | 丰富的插件系统，可扩展 2FA、Magic Link 等功能 |
| **零配置启动** - 默认配置即可使用，简化开发 |

### 1.2 当前项目认证架构

当前项目使用自定义的 Token 认证方式：
- Token 存储在 localStorage
- API 通过 Bearer Token 认证
- 支持 Google OAuth（现有实现）和微信登录

接入 Better Auth 后，将实现：
- Cookie-based 会话管理（更安全）
- 统一的认证流程
- 更好的类型支持
- 简化后的 API 认证

---

## 二、技术选型

### 2.1 架构对比

| 方案 | 优势 | 劣势 |
|------|------|------|
| **保持现有 Token** | 无需改动 | 安全性较低，localStorage 不安全 |
| **迁移到 Better Auth** | 安全性高，功能丰富 | 需要迁移代码 |

**推荐方案：迁移到 Better Auth**

### 2.2 技术栈

```
┌─────────────────────────────────────────────────────────┐
│                    前端层 (Next.js)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  better-auth/react (authClient)                  │  │
│  │  - useSession()                                  │  │
│  │  - signIn.social()                               │  │
│  │  - signOut()                                     │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           │ Cookie-based Session
                           │
┌──────────────────────────▼──────────────────────────────┐
│              Better Auth Server                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  /api/auth/[...all]/route.ts                    │  │
│  │  - Google OAuth 回调                             │  │
│  │  - 会话管理                                      │  │
│  │  - 用户认证                                      │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    数据存储层                             │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │  PostgreSQL      │  │  Cookie (加密)   │             │
│  │  用户数据        │  │  会话数据        │             │
│  └──────────────────┘  └──────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

---

## 三、服务端配置

### 3.1 安装依赖

```bash
npm install better-auth better-auth/react
```

### 3.2 创建 Auth 服务端配置

**文件路径：** `lib/auth-server.ts`

```typescript
import { betterAuth } from "better-auth";

/**
 * Better Auth 服务端实例
 */
export const auth = betterAuth({
  // 基础 URL，用于生成回调 URL
  // 生产环境必须正确配置，否则 Google OAuth 会失败
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  // 数据库配置（可选，无数据库时使用无状态模式）
  // database: new Pool({
  //   connectionString: process.env.DATABASE_URL,
  // }),

  // 社交登录配置
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // 会话配置
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7天过期
    updateAge: 60 * 60 * 24,     // 1天后刷新
    cookieCache: {
      enabled: true,
      maxAge: 300, // 5分钟缓存
    },
  },

  // 高级配置（可选）
  advanced: {
    // 使用 cookie 存储会话
    cookiePrefix: "better-auth",
    crossSubDomainCookies: {
      enabled: false, // 需要跨子域名时启用
    },
  },
});
```

### 3.3 创建 API 路由处理器

**文件路径：** `app/api/auth/[...all]/route.ts`

```typescript
import { auth } from "@/lib/auth-server";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth API 路由处理器
 *
 * 这个路由会处理所有认证相关的请求：
 * - /api/auth/sign-in/social/google - Google OAuth 登录
 * - /api/auth/callback/google - Google OAuth 回调
 * - /api/auth/get-session - 获取会话
 * - /api/auth/sign-out - 退出登录
 */
export const { GET, POST } = toNextJsHandler(auth);
```

### 3.4 API 端点说明

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/sign-in/social` | POST | 发起社交登录 |
| `/api/auth/sign-out` | POST | 退出登录 |
| `/api/auth/get-session` | GET | 获取当前会话 |
| `/api/auth/callback/google` | GET | Google OAuth 回调 |

---

## 四、客户端配置

### 4.1 创建 Auth 客户端

**文件路径：** `lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";

/**
 * Better Auth 客户端实例
 *
 * 用于前端调用认证相关 API
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
           process.env.BETTER_AUTH_URL ||
           "http://localhost:3000",
});
```

### 4.2 使用 useSession Hook

**文件路径：** `hooks/useAuth.ts`（重构现有文件）

```typescript
"use client";

import { authClient } from "@/lib/auth-client";

export type AuthUser = {
  id?: string;
  email?: string;
  name?: string;
  image?: string;
};

/**
 * 替代原有的 useAuth hook
 * 使用 Better Auth 的 useSession
 */
export function useAuth() {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  const logout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  };

  return {
    isAuthed: !!session,
    user: session?.user as AuthUser | null,
    session,
    isLoading: isPending,
    error,
    refetch,
    logout,
  };
}
```

### 4.3 社交登录

```typescript
// 触发 Google 登录
await authClient.signIn.social({
  provider: "google",
  callbackURL: `/${locale}/collections`,
});

// 触发 GitHub 登录（如已配置）
await authClient.signIn.social({
  provider: "github",
  callbackURL: "/dashboard",
});
```

### 4.4 退出登录

```typescript
await authClient.signOut({
  fetchOptions: {
    onSuccess: () => {
      // 登出成功后的回调
      router.push("/login");
    },
  },
});
```

---

## 五、Google OAuth 配置

### 5.1 Google Cloud 控制台配置步骤

#### 步骤 1：创建或选择项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目

#### 步骤 2：配置 OAuth 同意屏幕

1. 进入 `API 和服务` > `OAuth 同意屏幕`
2. 选择 `外部` 用户类型
3. 填写应用信息：
   - **应用名称**：LearnHub
   - **用户支持电子邮件**：你的邮箱
   - **已获授权的网域**：你的域名（生产环境）

4. 添加 OAuth 范围（点击 `添加或移除范围`）：
   - `.../auth/userinfo.email`（访问用户的电子邮件地址）
   - `.../auth/userinfo.profile`（访问用户的个人资料信息）

#### 步骤 3：创建 OAuth 2.0 客户端 ID

1. 进入 `API 和服务` > `凭据`
2. 点击 `创建凭据` > `OAuth 客户端 ID`
3. 选择应用类型：`Web 应用`
4. 配置已获授权的重定向 URI：

**开发环境：**
```
http://localhost:3000/api/auth/callback/google
```

**生产环境：**
```
https://yourdomain.com/api/auth/callback/google
https://yourdomain.com/api/auth/callback/google
```

5. 点击 `创建`，获取：
   - 客户端 ID (Client ID)
   - 客户端密钥 (Client Secret)

#### 步骤 4：启用 Google+ API

1. 进入 `API 和服务` > `库`
2. 搜索并启用 `Google+ API`

### 5.2 配置要点

| 配置项 | 开发环境 | 生产环境 |
|--------|----------|----------|
| **重定向 URI** | `http://localhost:3000/api/auth/callback/google` | `https://yourdomain.com/api/auth/callback/google` |
| **已获授权的网域** | `localhost` | `yourdomain.com` |
| **JavaScript 来源** | `http://localhost:3000` | `https://yourdomain.com` |

### 5.3 常见错误

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| `redirect_uri_mismatch` | 重定向 URI 不匹配 | 检查 Google Console 配置 |
| `invalid_client` | Client ID 或 Secret 错误 | 检查环境变量配置 |
| `access_denied` | 用户取消授权 | 正常流程，无需处理 |

---

## 六、环境变量配置

### 6.1 .env.local 文件

```bash
# ============================================
# Better Auth 配置
# ============================================

# 应用基础 URL（重要！用于生成正确的回调 URL）
# 开发环境
BETTER_AUTH_URL=http://localhost:3000

# 生产环境
# BETTER_AUTH_URL=https://learnhub.example.com

# ============================================
# Google OAuth 配置
# ============================================

# Google OAuth 客户端 ID
GOOGLE_CLIENT_ID=your_google_client_id_here

# Google OAuth 客户端密钥
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# ============================================
# 数据库配置（可选）
# ============================================

# PostgreSQL 数据库连接字符串
# DATABASE_URL=postgresql://user:password@localhost:5432/learnhub
```

### 6.2 .env 文件模板

创建 `.env.example` 文件作为模板：

```bash
# Better Auth
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Database (optional)
DATABASE_URL=
```

### 6.3 环境变量说明

| 变量名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `BETTER_AUTH_URL` | string | 是 | 应用基础 URL |
| `GOOGLE_CLIENT_ID` | string | 是 | Google OAuth 客户端 ID |
| `GOOGLE_CLIENT_SECRET` | string | 是 | Google OAuth 客户端密钥 |
| `DATABASE_URL` | string | 否 | 数据库连接字符串 |

---

## 七、会话管理

### 7.1 客户端会话管理

#### 获取会话

```typescript
import { authClient } from "@/lib/auth-client";

// 使用 Hook（推荐）
const { data: session, isPending, error } = authClient.useSession();

// 或手动获取
const { data: session } = await authClient.getSession();
```

#### 会话数据结构

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    image: string;
  },
  session: {
    id: string;
    userId: string;
    expiresAt: number;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  }
}
```

### 7.2 退出登录

```typescript
await authClient.signOut({
  fetchOptions: {
    onSuccess: () => {
      // 登出成功回调
    },
    onError: (error) => {
      // 登出失败回调
    },
  },
});
```

### 7.3 多设备会话管理

```typescript
// 获取所有会话
const { data: sessions } = await authClient.listSessions();

// 撤销指定会话
await authClient.revokeSession({
  token: "session-token",
});

// 撤销其他会话（保留当前）
await authClient.revokeOtherSessions();
```

### 7.4 会话配置选项

```typescript
session: {
  // 会话过期时间（秒）
  expiresIn: 60 * 60 * 24 * 7, // 7天

  // 会话刷新时间（秒）
  updateAge: 60 * 60 * 24, // 1天

  // 禁用会话自动刷新
  disableSessionRefresh: false,

  // 将会话存储在数据库
  storeSessionInDatabase: true,

  // Cookie 缓存配置
  cookieCache: {
    enabled: true,
    maxAge: 300, // 5分钟
  },
}
```

---

## 八、路由保护

### 8.1 客户端路由保护

使用现有的 `AuthGuard` 组件，更新为使用 Better Auth：

**文件路径：** `components/auth-guard.tsx`

```typescript
"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  return <>{children}</>;
}
```

### 8.2 服务端路由保护

```typescript
import { auth } from "@/lib/auth-server";
import { headers } from "next/headers";

export default async function ProtectedPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    redirect("/login");
  }

  return <div>Hello, {session.user.name}</div>;
}
```

### 8.3 Middleware 路由保护

**文件路径：** `middleware.ts`

```typescript
import { auth } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/collections");

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/collections", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 九、数据库集成

### 9.1 用户表结构

Better Auth 使用以下表结构（需要手动创建）：

```sql
-- 用户表
CREATE TABLE user (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  name VARCHAR(255),
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_user_email ON user(email);

-- 会话表（可选，取决于 session 配置）
CREATE TABLE session (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_session_user_id ON session(user_id);
CREATE INDEX idx_session_token ON session(token);

-- 账户表（社交登录使用）
CREATE TABLE account (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_account_provider_account_id ON account(provider, account_id);
CREATE INDEX idx_account_user_id ON account(user_id);
```

### 9.2 配置数据库连接

```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // 最大连接数
    idleTimeoutMillis: 30000, // 空闲连接超时
    connectionTimeoutMillis: 2000, // 连接超时
  }),

  session: {
    // 将会话存储在数据库
    storeSessionInDatabase: true,
  },
});
```

### 9.3 数据库迁移

使用 Better Auth 的迁移工具：

```typescript
import { generateMigration } from "better-auth/db/migrate";

// 生成迁移文件
await generateMigration({
  databaseAdapter: "pg",
  migrationPath: "./migrations",
});
```

---

## 十、与现有项目集成

### 10.1 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `lib/auth.ts` | 重构 | 使用 Better Auth 客户端 |
| `hooks/useAuth.ts` | 重构 | 使用 `useSession` Hook |
| `lib/api.ts` | 重构 | 移除 Token 认证逻辑 |
| `app/[locale]/login/page.tsx` | 重构 | 使用 `signIn.social()` |
| `app/api/auth/[...all]/route.ts` | 新增 | Better Auth API 路由 |
| `lib/auth-server.ts` | 新增 | 服务端配置 |
| `lib/auth-client.ts` | 新增 | 客户端配置 |
| `.env.local` | 更新 | 添加 Better Auth 配置 |
| `middleware.ts` | 更新 | 使用 Better Auth 会话 |

### 10.2 API 认证更新

**更新前（现有代码）：**

```typescript
// lib/api.ts
const token = getToken();
headers.Authorization = `Bearer ${token}`;
```

**更新后：**

```typescript
// 使用 Cookie 自动携带会话
// Better Auth 会自动处理认证，无需手动添加 header

// 服务端验证：
import { auth } from "@/lib/auth-server";
import { headers } from "next/headers";

const session = await auth.api.getSession({
  headers: await headers(),
});

if (!session) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}
```

### 10.3 登录页面更新

**更新前（现有代码）：**

```typescript
// 使用 Google Identity Services SDK
window.google.accounts.id.initialize({ ... });
```

**更新后：**

```typescript
// 使用 Better Auth
await authClient.signIn.social({
  provider: "google",
  callbackURL: `/${locale}/collections`,
});
```

---

## 十一、常见问题

### 11.1 Google OAuth 失败

**问题：** `redirect_uri_mismatch` 错误

**原因：** Google Console 配置的重定向 URI 与实际不符

**解决方案：**
1. 检查 `.env.local` 中的 `BETTER_AUTH_URL`
2. 确保 Google Console 中的重定向 URI 包含 `/api/auth/callback/google`
3. 端口号和协议（http/https）必须完全匹配

### 11.2 开发环境 Cookie 问题

**问题：** 开发环境 Cookie 无法设置

**解决方案：**
确保 `BETTER_AUTH_URL` 使用 `http://localhost:3000`，而不是 `http://127.0.0.1:3000`

### 11.3 会话频繁过期

**问题：** 用户频繁被登出

**解决方案：**
调整会话配置，延长过期时间：
```typescript
session: {
  expiresIn: 60 * 60 * 24 * 30, // 30天
  updateAge: 60 * 60 * 24 * 7, // 7天
}
```

### 11.4 类型错误

**问题：** TypeScript 类型不匹配

**解决方案：**
```bash
# 清除缓存并重新安装
rm -rf node_modules .next
npm install
npm run build
```

---

## 十二、后续扩展

### 12.1 邮箱/密码登录

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    // 发送验证邮件
    sendResetPassword: async ({ user, url }) => {
      // 发送密码重置邮件
    },
    sendVerificationEmail: async ({ user, url }) => {
      // 发送邮箱验证邮件
    },
  },
});

// 客户端使用
await authClient.signIn.email({
  email: "user@example.com",
  password: "password",
});
```

### 12.2 Magic Link（邮箱链接登录）

```typescript
import { magicLinkPlugin } from "better-auth/plugins/magic-link";

export const auth = betterAuth({
  plugins: [magicLinkPlugin()],
});

// 客户端发送 Magic Link
await authClient.magicLink.send({
  email: "user@example.com",
});
```

### 12.3 两步验证 (2FA)

```typescript
import { twoFactorPlugin } from "better-auth/plugins/two-factor";

export const auth = betterAuth({
  plugins: [twoFactorPlugin()],
});

// 客户端启用 2FA
await authClient.twoFactor.enable();
```

### 12.4 其他社交登录

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  socialProviders: {
    google: { clientId: "...", clientSecret: "..." },
    github: { clientId: "...", clientSecret: "..." },
    facebook: { clientId: "...", clientSecret: "..." },
  },
});
```

### 12.5 多租户支持

```typescript
import { multiSessionPlugin } from "better-auth/plugins/multi-session";

export const auth = betterAuth({
  plugins: [multiSessionPlugin()],
});
```

### 12.6 用户资料扩展

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        defaultValue: "user",
      },
    },
  },
});
```

---

## 附录

### A. 参考链接

- [Better Auth 官方文档](https://www.better-auth.com/)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [Next.js 集成指南](https://www.better-auth.com/docs/integrations/next)
- [Google OAuth 指南](https://www.better-auth.com/docs/authentication/google)

### B. 版本信息

- Better Auth: `^1.0.0`
- Next.js: `14.2.5`
- Node.js: `>=18.0.0`

### C. 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-01-18 | v1.0.0 | 初始版本，完成集成方案文档 |

---

**文档作者：** 开发团队
**最后更新：** 2026-01-18
