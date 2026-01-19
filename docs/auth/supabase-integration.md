# Supabase 集成方案

## 目录

- [一、概述](#一概述)
- [二、技术选型](#二技术选型)
- [三、前端配置 (Next.js)](#三前端配置-nextjs)
- [四、Google OAuth 配置](#四google-oauth-配置)
- [五、环境变量配置](#五环境变量配置)
- [六、会话管理](#六会话管理)
- [七、路由保护](#七路由保护)
- [八、Python 后端集成 (FastAPI)](#八python-后端集成-fastapi)
- [九、与现有项目集成](#九与现有项目集成)
- [十、移动端扩展](#十移动端扩展)
- [十一、常见问题](#十一常见问题)
- [十二、后续扩展](#十二后续扩展)

---

## 一、概述

### 1.1 为什么选择 Supabase

| 特性 | 说明 |
|------|------|
| **开箱即用** | 认证、数据库、存储一站式解决 |
| **快速上线** | 无需自建后端，Dashboard 配置即可 |
| **移动端支持** | Flutter、React Native、Swift、Kotlin 官方 SDK |
| **免费额度** | 500MB 数据库、1GB 存储、2GB 带宽/月 |
| **开发者友好** | 丰富的文档和示例代码 |

### 1.2 架构对比

**使用 Supabase：**
```
┌─────────────────────────────────────────────────────────┐
│              前端 (Next.js)                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  @supabase/supabase-js                       │  │
│  │  - signInWithOAuth()                          │  │
│  │  - getSession()                               │  │
│  │  - signOut()                                 │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           │ JWT Token
                           │
┌──────────────────────────▼──────────────────────────────┐
│              Supabase (托管服务)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  认证服务 (Auth)                           │  │
│  │  - Google OAuth                              │  │
│  │  - 会话管理                                  │  │
│  │  - JWT 验证                                  │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  PostgreSQL 数据库                             │  │
│  │  - 用户表                                    │  │
│  │  - 业务表                                    │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  实时订阅 (Realtime)                         │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           │
┌──────────────────────────▼──────────────────────────────┐
│           Python 后端 (FastAPI)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  业务 API                                     │  │
│  │  - 验证 JWT Token                            │  │
│  │  - 业务逻辑                                   │  │
│  │  - 数据查询                                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 二、技术选型

### 2.1 方案对比

| 维度 | Supabase | Better Auth |
|------|-----------|-------------|
| **配置复杂度** | ⭐ 简单 | ⭐⭐⭐ 复杂 |
| **开发时间** | ⭐⭐⭐⭐ 快 (1-2 天) | ⭐⭐⭐ 中 (2-3 天) |
| **移动端支持** | ⭐⭐⭐⭐⭐ 官方 SDK | ⭐ 无 |
| **数据库** | ⭐⭐⭐⭐⭐ 内置 | ⭐⭐ 需配置 |
| **成本** | 免费额度 + 付费扩展 | 完全免费 + 自维护 |

### 2.2 推荐理由

1. **快速上线** - Supabase Dashboard 配置即可，无需处理 OAuth 回调
2. **移动端复用** - Flutter/React Native 官方 SDK，同一套配置
3. **Python 友好** - `supabase-py` 官方 SDK，FastAPI 集成简单
4. **功能丰富** - 认证、数据库、实时、存储一站式

---

## 三、前端配置 (Next.js)

### 3.1 安装依赖

```bash
npm install @supabase/supabase-js
```

### 3.2 创建 Supabase 客户端

**文件路径：** `lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 客户端实例
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**文件路径：** `lib/supabase/server.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * 服务端 Supabase 客户端
 * 用于 Server Components 和 Server Actions
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: { Authorization: `Bearer ${cookieStore.get('sb-access-token')?.value}` },
      },
    }
  );
}
```

### 3.3 Google OAuth 登录

**文件路径：** `hooks/useAuth.ts`（重构）

```typescript
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type AuthUser = {
  id?: string;
  email?: string;
  name?: string;
  image?: string;
};

/**
 * 使用 Supabase 的 useAuth Hook
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user as AuthUser || null);
      setIsAuthed(!!session);
      setIsLoading(false);
    });

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as AuthUser || null);
      setIsAuthed(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Google login error:', error);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return {
    isAuthed,
    user,
    isLoading,
    loginWithGoogle,
    logout,
  };
}
```

### 3.4 登录回调处理

**文件路径：** `app/auth/callback/route.ts`

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 登录成功后重定向
  return NextResponse.redirect(new URL('/collections', request.url));
}
```

### 3.5 获取当前用户

```typescript
// 客户端获取
const { data: { user } } = await supabase.auth.getUser();

// 服务端获取
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

---

## 四、Google OAuth 配置

### 4.1 Supabase Dashboard 配置

#### 步骤 1：启用 Google 提供商

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 进入 `Authentication` > `Providers` > `Google`
3. 点击 `Enable` 启用 Google 登录
4. 填入 `Client ID` 和 `Client Secret`

#### 步骤 2：配置 Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建 OAuth 2.0 客户端 ID
3. 配置已获授权的重定向 URI：

**开发环境：**
```
http://localhost:3000/auth/callback
```

**生产环境：**
```
https://yourdomain.com/auth/callback
```

#### 步骤 3：获取凭据

从 Google Cloud Console 获取：
- **Client ID**
- **Client Secret**

### 4.2 Supabase 环境配置

在 Supabase Dashboard 中配置：

1. 进入 `Settings` > `API`
2. 复制 `Project URL` 和 `anon public key`
3. 进入 `Authentication` > `Providers` > `Google`
4. 填入 Google 的 Client ID 和 Client Secret

---

## 五、环境变量配置

### 5.1 .env.local 文件

```bash
# ============================================
# Supabase 配置
# ============================================

# Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase 匿名密钥（服务角色密钥不要在前端使用！）
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase 服务角色密钥（仅用于服务端）
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5.2 环境变量说明

| 变量名 | 类型 | 说明 |
|---------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | string | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string | 匿名密钥（前端使用） |
| `SUPABASE_SERVICE_ROLE_KEY` | string | 服务角色密钥（服务端使用，跳过 RLS） |

---

## 六、会话管理

### 6.1 获取会话

```typescript
// 客户端获取会话
const { data: { session } } = await supabase.auth.getSession();

// 服务端获取会话
const supabase = await createClient();
const { data: { session } } = await supabase.auth.getSession();
```

### 6.2 会话数据结构

```typescript
{
  access_token: string;      // JWT 访问令牌
  refresh_token: string;     // 刷新令牌
  expires_in: number;       // 过期时间（秒）
  token_type: "bearer";     // 令牌类型
  user: {
    id: string;            // 用户 ID
    email: string;         // 邮箱
    email_verified: boolean; // 邮箱验证状态
    user_metadata: {        // 用户元数据
      full_name?: string;
      avatar_url?: string;
    };
    app_metadata: {         // 应用元数据
      provider: string;
    };
  };
}
```

### 6.3 会话监听

```typescript
// 监听认证状态变化
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('Auth event:', event); // INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED
    console.log('Session:', session);
  }
);

// 取消监听
subscription.unsubscribe();
```

### 6.4 退出登录

```typescript
await supabase.auth.signOut({
  scope: 'global', // 'global' 登出所有设备，'local' 仅登出当前设备
});
```

---

## 七、路由保护

### 7.1 客户端路由保护

**文件路径：** `components/auth-guard.tsx`

```typescript
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthed, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthed) {
    router.push("/login");
    return null;
  }

  return <>{children}</>;
}
```

### 7.2 服务端路由保护

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <div>Hello, {user.email}</div>;
}
```

### 7.3 Middleware 路由保护

**文件路径：** `middleware.ts`

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 从 Cookie 获取 session
  const accessToken = request.cookies.get('sb-access-token')?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/collections");

  // 简单检查 token 是否存在（完整验证在 API 层）
  const hasToken = !!accessToken;

  if (!hasToken && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasToken && isAuthPage) {
    return NextResponse.redirect(new URL("/collections", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 八、Python 后端集成 (FastAPI)

### 8.1 安装依赖

```bash
pip install supabase fastapi python-jose[cryptography]
```

### 8.2 创建 Supabase 客户端

**文件路径：** `backend/app/core/supabase.py`

```python
import os
from supabase import create_client

supabase_url = os.getenv("SUPABASE_URL")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# 客户端实例（使用 anon key，受 RLS 限制）
supabase_client = create_client(
    supabase_url,
    supabase_anon_key
)

# 服务端实例（使用 service role key，跳过 RLS）
supabase_admin = create_client(
    supabase_url,
    supabase_service_role_key
)
```

### 8.3 JWT 验证依赖

**方案 A：使用 Supabase Python SDK 验证（推荐）**

**文件路径：** `backend/app/dependencies/auth.py`

```python
from typing import Optional
from fastapi import Depends, HTTPException, status
from supabase import create_client, Client

import os

supabase_url = os.getenv("SUPABASE_URL")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")

# 创建 Supabase 客户端
supabase: Client = create_client(supabase_url, supabase_anon_key)


async def get_current_user(
    authorization: Optional[str] = None
) -> dict:
    """
    从 Authorization header 获取当前用户

    Args:
        authorization: Authorization header，格式为 "Bearer {token}"

    Returns:
        用户信息字典

    Raises:
        HTTPException: 当 token 无效或过期时
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌"
        )

    # 提取 Bearer token
    try:
        token = authorization.replace("Bearer ", "")
    except AttributeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证格式"
        )

    # 使用 Supabase 验证 token
    try:
        response = supabase.auth.get_user(token)
        user = response.user

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证令牌"
            )

        return {
            "id": user.id,
            "email": user.email,
            "email_verified": user.email_confirmed_at is not None,
            "user_metadata": user.user_metadata,
            "app_metadata": user.app_metadata,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"认证失败: {str(e)}"
        )


# FastAPI 依赖注入使用
async def get_current_user_optional(
    authorization: Optional[str] = None
) -> Optional[dict]:
    """
    可选的用户认证，不强制要求登录

    Returns:
        用户信息字典或 None
    """
    if not authorization:
        return None

    try:
        token = authorization.replace("Bearer ", "")
        response = supabase.auth.get_user(token)
        user = response.user

        return {
            "id": user.id,
            "email": user.email,
            "email_verified": user.email_confirmed_at is not None,
        } if user else None

    except Exception:
        return None
```

**方案 B：使用 JWT 验证（更快速，本地验证）**

```python
from typing import Optional
from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError
from jose.jwk import RSAKey
from jose.utils import base64url_decode
import requests
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# 获取 JWKS（JSON Web Key Set）
def get_jwks() -> dict:
    """获取 Supabase 的 JWKS"""
    jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    response = requests.get(jwks_url)
    return response.json()

async def verify_jwt(token: str) -> dict:
    """
    验证 JWT token 并返回 claims

    Args:
        token: JWT token

    Returns:
        JWT claims

    Raises:
        HTTPException: 当 token 无效或过期时
    """
    try:
        # 如果配置了 JWT secret，直接验证
        if SUPABASE_JWT_SECRET:
            claims = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
            return claims

        # 否则使用 JWKS 验证
        jwks = get_jwks()
        header = jwt.get_unverified_header(token)
        rsa_key = RSAKey(
            key=jwks["keys"][header["kid"]],
            algorithm="RS256"
        )

        claims = jwt.decode(
            token,
            key=rsa_key,
            algorithms=["RS256"],
            audience="authenticated"
        )
        return claims

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"无效的令牌: {str(e)}"
        )


async def get_current_user_jwt(
    authorization: Optional[str] = None
) -> dict:
    """使用 JWT 验证获取当前用户"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌"
        )

    try:
        token = authorization.replace("Bearer ", "")
    except AttributeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证格式"
        )

    claims = await verify_jwt(token)

    return {
        "id": claims.get("sub"),
        "email": claims.get("email"),
        "email_verified": claims.get("email_verified", False),
        "role": claims.get("role"),
    }
```

### 8.4 在 API 中使用认证依赖

**文件路径：** `backend/app/api/v1/collections.py`

```python
from fastapi import APIRouter, Depends, status
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/collections", tags=["collections"])

@router.get("/")
async def get_collections(
    current_user: dict = Depends(get_current_user)
):
    """
    获取当前用户的错题集列表

    需要：JWT 认证
    """
    user_id = current_user["id"]

    # 从 Supabase 数据库查询用户数据
    data = supabase_client.table("collections").select("*").eq("user_id", user_id).execute()

    return {
        "data": data.data,
        "user": current_user
    }


@router.get("/{collection_id}")
async def get_collection(
    collection_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    获取指定错题集详情
    """
    # 检查权限：确保集合属于当前用户
    data = supabase_client.table("collections") \
        .select("*") \
        .eq("id", collection_id) \
        .eq("user_id", current_user["id"]) \
        .execute()

    if not data.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="错题集不存在或无权访问"
        )

    return data.data[0]
```

### 8.5 可选认证的 API

```python
from app.dependencies.auth import get_current_user_optional

@router.get("/public")
async def get_public_data(
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    公开 API，登录和非登录用户都可以访问
    """
    if current_user:
        # 已登录用户可以获取更多数据
        return {"data": "...", "user": current_user}
    else:
        # 未登录用户获取基础数据
        return {"data": "..."}
```

### 8.6 全局错误处理

**文件路径：** `backend/app/core/exceptions.py`

```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


async def http_exception_handler(request: Request, exc: HTTPException):
    """全局 HTTP 异常处理"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.detail,
                "status": exc.status_code
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """全局验证异常处理"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "message": "请求参数验证失败",
                "details": exc.errors(),
                "status": status.HTTP_422_UNPROCESSABLE_ENTITY
            }
        }
    )
```

### 8.7 Python 环境变量

```bash
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret  # 可选，用于本地 JWT 验证
```

---

## 九、与现有项目集成

### 9.1 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `lib/auth.ts` | 删除 | 替换为 Supabase 客户端 |
| `hooks/useAuth.ts` | 重构 | 使用 Supabase auth |
| `lib/api.ts` | 重构 | 使用 JWT 认证替代 Token |
| `lib/supabase/client.ts` | 新增 | Supabase 客户端 |
| `lib/supabase/server.ts` | 新增 | 服务端客户端 |
| `app/auth/callback/route.ts` | 新增 | OAuth 回调处理 |
| `.env.local` | 更新 | 添加 Supabase 配置 |

### 9.2 前端 API 调用更新

**更新前：**
```typescript
// lib/api.ts
const token = getToken();
headers.Authorization = `Bearer ${token}`;
```

**更新后：**
```typescript
// Supabase 自动处理 Cookie，无需手动添加 Authorization
// 调用后端 API 时，需要从 session 获取 token

const { data: { session } } = await supabase.auth.getSession();

await fetch('/api/collections', {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,
  },
});
```

### 9.3 登录页面更新

**更新前：**
```typescript
// 使用 Google Identity Services SDK
window.google.accounts.id.initialize({ ... });
```

**更新后：**
```typescript
const { loginWithGoogle } = useAuth();

// 点击 Google 登录按钮
<button onClick={loginWithGoogle}>
  Google 登录
</button>
```

---

## 十、移动端扩展

### 10.1 Flutter 集成

**安装依赖：**
```bash
flutter pub add supabase_flutter google_sign_in
```

**初始化：**
```dart
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  await Supabase.initialize(
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key',
  );
  runApp(MyApp());
}
```

**Google 登录：**
```dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> signInWithGoogle() async {
  final GoogleSignIn googleSignIn = GoogleSignIn();
  final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
  final GoogleSignInAuthentication googleAuth = await googleUser!.authentication;

  final response = await Supabase.instance.auth.signInWithIdToken(
    provider: OAuthProvider.google,
    idToken: googleAuth.idToken!,
    accessToken: googleAuth.accessToken,
  );

  if (response.user != null) {
    // 登录成功
  }
}
```

### 10.2 React Native 集成

**安装依赖：**
```bash
npm install @supabase/supabase-js @react-native-google-signin/google-signin
```

**Google 登录：**
```typescript
import { supabase } from './supabase';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();

  const { data } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: userInfo.idToken,
  });

  if (data.user) {
    // 登录成功
  }
};
```

### 10.3 原生 iOS (Swift)

**安装依赖：**
```swift
import Supabase
import GoogleSignIn
```

**Google 登录：**
```swift
let googleSignIn = GIDSignIn.sharedInstance()
googleSignIn.signInWith(presenting: self) { user, error in
    guard let user = user else { return }

    let idToken = user.authentication.idToken
    let accessToken = user.authentication.accessToken

    Task {
        do {
            let session = try await supabase.auth.signInWithIdToken(
                provider: .google,
                idToken: idToken,
                accessToken: accessToken
            )
            // 登录成功
        } catch {
            print(error)
        }
    }
}
```

### 10.4 原生 Android (Kotlin)

```kotlin
import io.supabase.SupabaseClient
import com.google.android.gms.auth.api.signin.GoogleSignIn

suspend fun signInWithGoogle(googleSignInAccount: GoogleSignInAccount) {
    val idToken = googleSignInAccount.idToken ?: throw Exception("No ID Token")
    val accessToken = googleSignInAccount.serverAuthCode ?: throw Exception("No Access Token")

    val session = supabase.auth.signInWithIdToken(
        provider = Provider.google,
        idToken = idToken,
        accessToken = accessToken
    )

    // 登录成功
}
```

---

## 十一、常见问题

### 11.1 Google OAuth 回调失败

**问题：** 重定向后未成功登录

**解决方案：**
1. 检查 Supabase Dashboard 的 Redirect URL 配置
2. 确保与前端路由 `/auth/callback` 一致
3. 检查 Google Cloud Console 的授权域名

### 11.2 后端 API 401 错误

**问题：** 调用后端 API 时返回 401

**解决方案：**
1. 检查前端是否正确发送 Authorization header
2. 验证 token 是否有效且未过期
3. 检查后端的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 是否正确

### 11.3 Session 过期

**问题：** 用户频繁被登出

**解决方案：**
Supabase 默认会自动刷新 token，无需手动处理。如需调整：

```typescript
// 前端：自动刷新已启用
supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
  },
});
```

### 11.4 跨域问题

**问题：** 前端调用后端 API 时出现 CORS 错误

**解决方案：**
```python
# FastAPI 配置 CORS
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 十二、后续扩展

### 12.1 邮箱/密码登录

```typescript
// 注册
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// 登录
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

### 12.2 Magic Link（邮箱链接登录）

```typescript
await supabase.auth.signInWithOtp({
  email: 'user@example.com',
});
```

### 12.3 其他社交登录

```typescript
// GitHub
await supabase.auth.signInWithOAuth({
  provider: 'github',
});

// Facebook
await supabase.auth.signInWithOAuth({
  provider: 'facebook',
});
```

### 12.4 用户资料管理

```typescript
// 更新用户信息
await supabase.auth.updateUser({
  data: {
    full_name: 'John Doe',
    avatar_url: 'https://...',
  },
});
```

### 12.5 数据库 RLS（行级安全）

在 Supabase Dashboard 中配置 RLS 策略：

```sql
-- 只有用户自己可以访问自己的数据
CREATE POLICY "Users can only access their own collections"
ON collections
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- 启用 RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
```

---

## 附录

### A. Supabase vs Better Auth 对比

| 维度 | Supabase | Better Auth |
|--------|-----------|-------------|
| 快速上线 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 移动端支持 | ⭐⭐⭐⭐⭐ | ⭐ |
| Python 后端 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 自定义性 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 成本 | 免费额度 + 付费 | 完全免费 |

### B. 参考链接

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Auth 指南](https://supabase.com/docs/guides/auth)
- [Supabase Python SDK](https://github.com/supabase/supabase-py)
- [Supabase FastAPI 集成](https://supabase.com/docs/guides/getting-started/tutorials/with-fastapi)

### C. 版本信息

- Supabase: Latest
- Next.js: 14.2.5
- Python: 3.10+
- FastAPI: Latest

### D. 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-01-18 | v1.0.0 | 初始版本，完成 Supabase 集成方案文档 |

---

**文档作者：** 开发团队
**最后更新：** 2026-01-18
