# Python FastAPI 后端 Supabase 集成方案 (方案 A)

## 目录

- [一、概述](#一概述)
- [二、项目结构](#二项目结构)
- [三、依赖安装](#三依赖安装)
- [四、Supabase 客户端配置](#四supabase-客户端配置)
- [五、认证依赖](#五认证依赖)
- [六、API 路由集成](#六api-路由集成)
- [七、数据库操作](#七数据库操作)
- [八、异常处理](#八异常处理)
- [九、测试](#九测试)
- [十、部署](#十部署)
- [十一、常见问题](#十一常见问题)

---

## 一、概述

### 1.1 方案 A 说明

**方案 A：使用 Supabase Python SDK 验证 JWT**

通过 Supabase 官方 Python SDK (`supabase-py`) 的 `auth.get_user(token)` 方法验证 JWT token。每次请求都会调用 Supabase Auth API 进行验证。

### 1.2 方案对比

| 维度 | 方案 A (SDK 验证) | 方案 B (本地 JWT 验证) |
|--------|---------------------|-------------------------|
| **实现复杂度** | ⭐⭐ 简单 | ⭐⭐⭐ 中等 |
| **验证速度** | ⭐⭐⭐ 中等（需要网络请求） | ⭐⭐⭐⭐⭐ 快（本地验证） |
| **可靠性** | ⭐⭐⭐⭐⭐ 高（由 Supabase 处理） | ⭐⭐⭐⭐ 高（需正确配置） |
| **Token 刷新** | ✅ 自动处理 | ❌ 需手动处理 |
| **适用场景** | 中小规模、对速度要求不高 | 高并发、对速度要求高 |

### 1.3 选择方案 A 的理由

1. **实现简单** - 只需调用 Supabase SDK，无需处理 JWT 解码逻辑
2. **自动刷新** - SDK 自动处理过期 token 的刷新
3. **可靠性高** - Supabase 官方保证验证逻辑正确
4. **维护简单** - Supabase 更新安全策略时无需修改后端代码

---

## 二、项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 应用入口
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # 认证相关 API
│   │   │   ├── collections.py  # 错题集 API
│   │   │   └── problems.py     # 错题 API
│   │   └── deps.py           # 依赖注入（替代方案）
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py         # 配置管理
│   │   └── supabase.py       # Supabase 客户端
│   ├── dependencies/
│   │   ├── __init__.py
│   │   └── auth.py          # 认证依赖
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py       # Pydantic 模型
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py   # 认证服务
│   │   └── collection_service.py # 业务服务
│   └── utils/
│       ├── __init__.py
│       └── exceptions.py    # 异常处理
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   └── test_collections.py
├── .env.example
├── .env
├── requirements.txt
├── pyproject.toml
└── README.md
```

---

## 三、依赖安装

### 3.1 requirements.txt

```txt
# FastAPI
fastapi>=0.104.0
uvicorn[standard]>=0.24.0

# Supabase
supabase>=2.0.0

# 数据验证
pydantic>=2.0.0
pydantic-settings>=2.0.0

# 工具
python-dotenv>=1.0.0
python-multipart>=0.0.6

# 开发工具
pytest>=7.4.0
pytest-asyncio>=0.21.0
httpx>=0.25.0
```

### 3.2 安装依赖

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

---

## 四、Supabase 客户端配置

### 4.1 环境变量配置

**文件路径：** `.env.example`

```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# FastAPI 配置
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true

# CORS 配置
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# 日志配置
LOG_LEVEL=INFO
```

### 4.2 配置管理

**文件路径：** `app/core/config.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""

    # Supabase 配置
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # FastAPI 配置
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True

    # CORS 配置
    CORS_ORIGINS: str = "http://localhost:3000"

    # 日志配置
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """将 CORS_ORIGINS 转换为列表"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()
```

### 4.3 Supabase 客户端初始化

**文件路径：** `app/core/supabase.py`

```python
from supabase import create_client, Client
from app.core.config import get_settings

settings = get_settings()

# 客户端实例（使用 anon key，受 RLS 限制）
# 用于普通 API 调用，会遵循 RLS 策略
supabase_client: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_ANON_KEY
)

# 服务端实例（使用 service role key，跳过 RLS）
# 用于管理员操作，绕过 RLS 策略
supabase_admin: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)
```

### 4.4 使用说明

```python
from app.core.supabase import supabase_client, supabase_admin

# 普通用户操作（遵循 RLS）
result = supabase_client.table("collections").select("*").execute()

# 管理员操作（跳过 RLS）
result = supabase_admin.table("collections").select("*").execute()
```

---

## 五、认证依赖

### 5.1 认证模型定义

**文件路径：** `app/models/schemas.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, Any


class User(BaseModel):
    """用户信息"""
    id: str = Field(..., description="用户 ID")
    email: str = Field(..., description="邮箱")
    email_verified: bool = Field(default=False, description="邮箱是否验证")
    user_metadata: dict = Field(default_factory=dict, description="用户元数据")
    app_metadata: dict = Field(default_factory=dict, description="应用元数据")
    role: str = Field(default="authenticated", description="用户角色")

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    """认证响应"""
    user: User
    session: Optional[dict] = None


class ErrorResponse(BaseModel):
    """错误响应"""
    error: dict


class ErrorDetail(BaseModel):
    """错误详情"""
    message: str
    status: Optional[int] = None
```

### 5.2 认证依赖实现

**文件路径：** `app/dependencies/auth.py`

```python
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from app.core.supabase import supabase_client
from app.models.schemas import User
import logging

logger = logging.getLogger(__name__)


async def get_current_user(
    request: Request
) -> User:
    """
    从请求中获取并验证当前用户

    优先从 Authorization header 获取 token，如果不存在则从 cookie 获取

    Args:
        request: FastAPI Request 对象

    Returns:
        User: 认证用户信息

    Raises:
        HTTPException: 当 token 无效或过期时，返回 401
    """
    # 尝试从 Authorization header 获取 token
    authorization = request.headers.get("authorization")

    if not authorization:
        # 尝试从 cookie 获取
        token = request.cookies.get("sb-access-token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="未提供认证令牌"
            )
    else:
        # 提取 Bearer token
        try:
            if authorization.lower().startswith("bearer "):
                token = authorization[7:]
            else:
                token = authorization
        except (AttributeError, IndexError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证格式"
            )

    # 使用 Supabase SDK 验证 token
    try:
        response = supabase_client.auth.get_user(token)

        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证令牌"
            )

        user = response.user

        # 构建用户信息
        return User(
            id=user.id,
            email=user.email or "",
            email_verified=user.email_confirmed_at is not None,
            user_metadata=user.user_metadata or {},
            app_metadata=user.app_metadata or {},
            role=user.app_metadata.get("role", "authenticated")
        )

    except Exception as e:
        logger.error(f"认证失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="认证失败，请重新登录"
        )


async def get_current_user_optional(
    request: Request
) -> Optional[User]:
    """
    可选的用户认证，不强制要求登录

    如果 token 无效或不存在，返回 None 而不是抛出异常

    Args:
        request: FastAPI Request 对象

    Returns:
        Optional[User]: 认证用户信息或 None
    """
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def require_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    要求用户邮箱已验证

    Args:
        current_user: 当前用户

    Returns:
        User: 已验证的用户

    Raises:
        HTTPException: 当邮箱未验证时，返回 403
    """
    if not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="请先验证邮箱"
        )
    return current_user


async def require_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    要求管理员权限

    Args:
        current_user: 当前用户

    Returns:
        User: 管理员用户

    Raises:
        HTTPException: 当用户不是管理员时，返回 403
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    return current_user
```

### 5.3 使用示例

```python
from fastapi import APIRouter, Depends
from app.dependencies.auth import (
    get_current_user,
    get_current_user_optional,
    require_verified_user,
    require_admin_user,
)

router = APIRouter()

# 强制登录
@router.get("/protected")
async def protected_route(
    current_user: User = Depends(get_current_user)
):
    return {"message": f"Hello, {current_user.email}"}

# 可选登录
@router.get("/public")
async def public_route(
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if current_user:
        return {"message": f"Hello, {current_user.email}"}
    return {"message": "Hello, guest"}

# 需要邮箱验证
@router.get("/verified")
async def verified_route(
    current_user: User = Depends(require_verified_user)
):
    return {"message": "邮箱已验证"}

# 需要管理员权限
@router.get("/admin")
async def admin_route(
    current_user: User = Depends(require_admin_user)
):
    return {"message": "管理员访问"}
```

---

## 六、API 路由集成

### 6.1 主应用入口

**文件路径：** `app/main.py`

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.config import get_settings
from app.api.v1 import api_router
import logging

settings = get_settings()
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info("应用启动中...")
    yield
    logger.info("应用关闭...")


# 创建 FastAPI 应用
app = FastAPI(
    title="LearnHub API",
    description="错题收集整理工具 API",
    version="1.0.0",
    lifespan=lifespan
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 全局异常处理
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """请求验证异常处理"""
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "message": "请求参数验证失败",
                "details": exc.errors(),
                "status": 422
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """全局异常处理"""
    logger.error(f"未处理的异常: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "message": "服务器内部错误",
                "status": 500
            }
        }
    )


# 注册路由
app.include_router(api_router, prefix="/api/v1")


# 健康检查
@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "ok", "service": "learnhub-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD
    )
```

### 6.2 API 路由聚合

**文件路径：** `app/api/v1/__init__.py`

```python
from fastapi import APIRouter
from app.api.v1 import auth, collections, problems

api_router = APIRouter()

# 注册子路由
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(collections.router, prefix="/collections", tags=["错题集"])
api_router.include_router(problems.router, prefix="/problems", tags=["错题"])
```

### 6.3 认证相关 API

**文件路径：** `app/api/v1/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.dependencies.auth import get_current_user, User
from app.core.supabase import supabase_client
from app.models.schemas import AuthResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class TokenVerifyRequest(BaseModel):
    """Token 验证请求"""
    access_token: str


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> AuthResponse:
    """
    获取当前用户信息

    需要认证
    """
    return AuthResponse(user=current_user)


@router.post("/verify")
async def verify_token(request: TokenVerifyRequest) -> AuthResponse:
    """
    验证 access token 是否有效

    可用于前端检查登录状态
    """
    try:
        response = supabase_client.auth.get_user(request.access_token)

        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的令牌"
            )

        return AuthResponse(
            user=User(
                id=response.user.id,
                email=response.user.email or "",
                email_verified=response.user.email_confirmed_at is not None,
                user_metadata=response.user.user_metadata or {},
                app_metadata=response.user.app_metadata or {}
            )
        )

    except Exception as e:
        logger.error(f"Token 验证失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="令牌验证失败"
        )
```

### 6.4 错题集 API

**文件路径：** `app/api/v1/collections.py`

```python
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from app.dependencies.auth import get_current_user, get_current_user_optional, User
from app.core.supabase import supabase_client
from app.models.schemas import ErrorResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# ====== 请求/响应模型 ======

class CollectionCreate(BaseModel):
    """创建错题集请求"""
    name: str = Field(..., min_length=1, max_length=100, description="错题集名称")
    description: Optional[str] = Field(None, max_length=500, description="描述")


class CollectionUpdate(BaseModel):
    """更新错题集请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class CollectionResponse(BaseModel):
    """错题集响应"""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    problem_count: int = 0
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


# ====== API 端点 ======

@router.get("", response_model=List[CollectionResponse])
async def get_collections(
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="返回数量")
):
    """
    获取当前用户的错题集列表

    需要 JWT 认证
    """
    try:
        # 使用 Supabase 查询当前用户的错题集
        result = supabase_client.table("collections") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .order("created_at", desc=True) \
            .range(skip, skip + limit - 1) \
            .execute()

        return result.data if result.data else []

    except Exception as e:
        logger.error(f"获取错题集失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取错题集失败"
        )


@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    获取指定错题集详情

    需要 JWT 认证，且只能访问自己的错题集
    """
    try:
        result = supabase_client.table("collections") \
            .select("*") \
            .eq("id", collection_id) \
            .eq("user_id", current_user.id) \
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="错题集不存在或无权访问"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取错题集详情失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取错题集详情失败"
        )


@router.post("", response_model=CollectionResponse, status_code=201)
async def create_collection(
    collection: CollectionCreate,
    current_user: User = Depends(get_current_user)
):
    """
    创建新的错题集

    需要 JWT 认证
    """
    try:
        result = supabase_client.table("collections") \
            .insert({
                "user_id": current_user.id,
                "name": collection.name,
                "description": collection.description,
            }) \
            .select() \
            .execute()

        if result.data:
            return result.data[0]

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建错题集失败"
        )

    except Exception as e:
        logger.error(f"创建错题集失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建错题集失败"
        )


@router.put("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: str,
    collection: CollectionUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    更新错题集

    需要 JWT 认证，且只能更新自己的错题集
    """
    try:
        # 先检查权限
        check_result = supabase_client.table("collections") \
            .select("id") \
            .eq("id", collection_id) \
            .eq("user_id", current_user.id) \
            .execute()

        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="错题集不存在或无权访问"
            )

        # 执行更新
        result = supabase_client.table("collections") \
            .update({
                "name": collection.name,
                "description": collection.description,
            }) \
            .eq("id", collection_id) \
            .select() \
            .execute()

        if result.data:
            return result.data[0]

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新错题集失败"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新错题集失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新错题集失败"
        )


@router.delete("/{collection_id}", status_code=204)
async def delete_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    删除错题集

    需要 JWT 认证，且只能删除自己的错题集
    """
    try:
        # 先检查权限
        check_result = supabase_client.table("collections") \
            .select("id") \
            .eq("id", collection_id) \
            .eq("user_id", current_user.id) \
            .execute()

        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="错题集不存在或无权访问"
            )

        # 执行删除
        supabase_client.table("collections") \
            .delete() \
            .eq("id", collection_id) \
            .execute()

        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除错题集失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除错题集失败"
        )


@router.get("/public/{collection_id}")
async def get_public_collection(
    collection_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    获取公开的错题集（示例：公开 API）

    登录用户可以看到更多详情
    """
    try:
        # 假设表中有 is_public 字段
        result = supabase_client.table("collections") \
            .select("*") \
            .eq("id", collection_id) \
            .eq("is_public", True) \
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="错题集不存在"
            )

        collection = result.data[0]

        # 登录用户可以看到更多信息
        if current_user:
            # 可以在这里添加额外信息
            collection["is_owner"] = collection["user_id"] == current_user.id
        else:
            collection["is_owner"] = False

        return collection

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取公开错题集失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取错题集失败"
        )
```

---

## 七、数据库操作

### 7.1 基本操作

```python
from app.core.supabase import supabase_client

# 查询
result = supabase_client.table("collections").select("*").execute()
data = result.data

# 插入
result = supabase_client.table("collections").insert({
    "name": "错题集1",
    "user_id": "user-123"
}).execute()

# 更新
result = supabase_client.table("collections").update({
    "name": "新名称"
}).eq("id", "collection-id").execute()

# 删除
result = supabase_client.table("collections").delete().eq("id", "collection-id").execute()

# 计数
result = supabase_client.table("collections").select("*", count="exact").execute()
count = result.count
```

### 7.2 高级查询

```python
# 多条件查询
result = supabase_client.table("problems") \
    .select("*") \
    .eq("collection_id", "collection-id") \
    .gte("created_at", "2024-01-01") \
    .order("created_at", desc=True) \
    .limit(10) \
    .execute()

# 关联查询
result = supabase_client.table("problems") \
    .select("*, collections(name, user_id)") \
    .execute()

# 模糊搜索
result = supabase_client.table("problems") \
    .select("*") \
    .ilike("note", "%数学%") \
    .execute()
```

### 7.3 事务处理

```python
# Supabase 通过 RLS 策略实现事务效果
# 对于需要原子操作的场景，可以使用 Postgres 函数
result = supabase_client.rpc("create_collection_with_problems", {
    "collection_name": "新错题集",
    "user_id": "user-123",
    "problems": [
        {"note": "题目1", "tags": ["数学"]},
        {"note": "题目2", "tags": ["物理"]},
    ]
}).execute()
```

---

## 八、异常处理

### 8.1 自定义异常

**文件路径：** `app/utils/exceptions.py`

```python
from fastapi import HTTPException, status


class AuthenticationError(HTTPException):
    """认证错误"""
    def __init__(self, detail: str = "认证失败"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )


class AuthorizationError(HTTPException):
    """授权错误"""
    def __init__(self, detail: str = "无权访问"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class NotFoundError(HTTPException):
    """资源不存在错误"""
    def __init__(self, detail: str = "资源不存在"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class ValidationError(HTTPException):
    """验证错误"""
    def __init__(self, detail: str = "请求参数验证失败"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )


class InternalServerError(HTTPException):
    """内部服务器错误"""
    def __init__(self, detail: str = "服务器内部错误"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )
```

### 8.2 使用自定义异常

```python
from app.utils.exceptions import NotFoundError, AuthenticationError

@router.get("/collections/{collection_id}")
async def get_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user)
):
    result = supabase_client.table("collections") \
        .select("*") \
        .eq("id", collection_id) \
        .eq("user_id", current_user.id) \
        .execute()

    if not result.data:
        raise NotFoundError("错题集不存在或无权访问")

    return result.data[0]
```

---

## 九、测试

### 9.1 测试配置

**文件路径：** `tests/conftest.py`

```python
import pytest
import os
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import Settings

# 测试环境配置
os.environ["SUPABASE_URL"] = "https://test-project.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "test-anon-key"
os.environ["API_HOST"] = "localhost"
os.environ["API_PORT"] = "8000"

@pytest.fixture
def client():
    """测试客户端"""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """测试用的认证 headers"""
    # 使用有效的测试 token
    return {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
```

### 9.2 认证测试

**文件路径：** `tests/test_auth.py`

```python
def test_get_current_user_without_token(client):
    """测试无 token 访问受保护端点"""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_get_current_user_with_invalid_token(client):
    """测试无效 token 访问受保护端点"""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid-token"}
    )
    assert response.status_code == 401


def test_verify_token(client, auth_headers):
    """测试 token 验证"""
    response = client.post(
        "/api/v1/auth/verify",
        json={"access_token": "valid-test-token"}
    )
    assert response.status_code == 200
    assert "user" in response.json()
```

### 9.3 API 测试

**文件路径：** `tests/test_collections.py`

```python
def test_get_collections(client, auth_headers):
    """测试获取错题集列表"""
    response = client.get("/api/v1/collections", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_collection(client, auth_headers):
    """测试创建错题集"""
    response = client.post(
        "/api/v1/collections",
        headers=auth_headers,
        json={"name": "测试错题集", "description": "测试描述"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "测试错题集"


def test_create_collection_invalid_data(client, auth_headers):
    """测试创建错题集时提供无效数据"""
    response = client.post(
        "/api/v1/collections",
        headers=auth_headers,
        json={"name": ""}  # name 不能为空
    )
    assert response.status_code == 422


def test_get_collection_not_found(client, auth_headers):
    """测试获取不存在的错题集"""
    response = client.get(
        "/api/v1/collections/not-exist-id",
        headers=auth_headers
    )
    assert response.status_code == 404


def test_update_collection(client, auth_headers):
    """测试更新错题集"""
    # 先创建
    create_response = client.post(
        "/api/v1/collections",
        headers=auth_headers,
        json={"name": "原始名称"}
    )
    collection_id = create_response.json()["id"]

    # 更新
    update_response = client.put(
        f"/api/v1/collections/{collection_id}",
        headers=auth_headers,
        json={"name": "新名称"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "新名称"


def test_delete_collection(client, auth_headers):
    """测试删除错题集"""
    # 先创建
    create_response = client.post(
        "/api/v1/collections",
        headers=auth_headers,
        json={"name": "要删除的错题集"}
    )
    collection_id = create_response.json()["id"]

    # 删除
    delete_response = client.delete(
        f"/api/v1/collections/{collection_id}",
        headers=auth_headers
    )
    assert delete_response.status_code == 204
```

### 9.4 运行测试

```bash
# 运行所有测试
pytest

# 运行特定测试文件
pytest tests/test_auth.py

# 显示详细输出
pytest -v

# 显示覆盖率
pytest --cov=app --cov-report=html
```

---

## 十、部署

### 10.1 Docker 配置

**文件路径：** `Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**文件路径：** `docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - API_HOST=0.0.0.0
      - API_PORT=8000
      - LOG_LEVEL=INFO
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

### 10.2 部署命令

```bash
# 构建镜像
docker build -t learnhub-api .

# 运行容器
docker run -d -p 8000:8000 --env-file .env learnhub-api

# 使用 docker-compose
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 10.3 云服务部署

#### Vercel (Serverless)
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### AWS ECS / Fargate
```bash
# 构建镜像
docker build -t learnhub-api .

# 推送到 ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin YOUR_ECR_URI
docker tag learnhub-api:latest YOUR_ECR_URI/learnhub-api:latest
docker push YOUR_ECR_URI/learnhub-api:latest

# 部署到 ECS
aws ecs update-service --cluster learnhub-cluster --service learnhub-service --force-new-deployment
```

#### Railway / Render
```bash
# 连接 Git 仓库后自动部署
# 或使用 CLI
railway up
```

---

## 十一、常见问题

### 11.1 Token 验证失败

**问题：** `get_user(token)` 抛出异常

**原因：**
- Token 已过期
- Token 格式错误
- Supabase URL 或 key 配置错误

**解决方案：**
```python
try:
    response = supabase_client.auth.get_user(token)
except Exception as e:
    # 检查具体错误信息
    error_msg = str(e).lower()

    if "invalid token" in error_msg or "expired" in error_msg:
        raise HTTPException(
            status_code=401,
            detail="令牌已过期，请重新登录"
        )
    else:
        raise HTTPException(
            status_code=401,
            detail="认证失败"
        )
```

### 11.2 CORS 问题

**问题：** 前端调用 API 时出现 CORS 错误

**解决方案：**
```python
# 确保在 main.py 中正确配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 确保前端请求时包含 credentials
fetch('/api/collections', {
  credentials: 'include',
});
```

### 11.3 数据库连接问题

**问题：** Supabase API 调用失败

**解决方案：**
1. 检查 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 是否正确
2. 确认 Supabase 项目是否正常运行
3. 检查网络连接
4. 查看日志中的详细错误信息

### 11.4 性能问题

**问题：** API 响应较慢

**优化建议：**
1. **添加缓存**：
```python
from functools import lru_cache
from datetime import datetime, timedelta

@lru_cache(maxsize=100)
def get_cached_user(token: str) -> dict:
    """缓存的用户验证"""
    response = supabase_client.auth.get_user(token)
    return response.user
```

2. **使用连接池**：Supabase SDK 内置连接池，无需额外配置

3. **考虑方案 B**：如果性能要求高，考虑使用本地 JWT 验证

### 11.5 RLS 策略问题

**问题：** 无法访问数据或返回权限错误

**解决方案：**
```sql
-- 在 Supabase Dashboard 中检查 RLS 策略
-- 确保策略正确配置

-- 示例：用户只能访问自己的错题集
CREATE POLICY "Users can view their own collections"
ON collections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections"
ON collections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
ON collections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
ON collections FOR DELETE
USING (auth.uid() = user_id);
```

---

## 附录

### A. Supabase API 响应格式

```python
# 查询响应
{
    "data": [...],           # 查询结果
    "count": 10,            # 计数（当启用 count="exact" 时）
    "error": None            # 错误信息
}

# 单条操作响应
{
    "data": {...},           # 操作结果
    "error": None            # 错误信息
}

# 错误响应
{
    "data": None,           # 无数据
    "error": {              # 错误信息
        "code": "23505",    # 错误代码
        "message": "...",     # 错误消息
        "details": "...",    # 错误详情
        "hint": "..."        # 提示信息
    }
}
```

### B. 参考链接

- [Supabase Python SDK](https://github.com/supabase/supabase-py)
- [Supabase API 文档](https://supabase.com/docs/reference/python)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Pydantic 文档](https://docs.pydantic.dev/)

### C. 版本信息

- Python: 3.11+
- FastAPI: 0.104+
- Supabase Python: 2.0+
- Pydantic: 2.0+

### D. 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-01-18 | v1.0.0 | 初始版本，完成 Python FastAPI 后端 Supabase 集成方案 A 文档 |

---

**文档作者：** 开发团队
**最后更新：** 2026-01-18
