# 项目文档

## 目录结构

- `prd/` - 产品需求文档 (Product Requirements Document)
  - 功能模块相关的PRD文档
  - 用户故事和用例
  - 需求分析和设计文档
- `auth/` - 认证相关文档
  - Better Auth 集成方案

## 认证文档

- [Better Auth 集成方案](./auth/better-auth-integration.md) - 详细的 Better Auth 接入指南，包括服务端配置、客户端配置、Google OAuth 配置等
- [Supabase 集成方案](./auth/supabase-integration.md) - 详细的 Supabase 接入指南，包括 Next.js 前端集成、Python FastAPI 后端集成、Google OAuth 配置、移动端扩展等
- [Python FastAPI 后端 Supabase 集成 (方案 A)](./auth/python-fastapi-supabase.md) - Python FastAPI 后端使用 Supabase SDK 验证 JWT 的详细实现方案，包括认证依赖、API 路由集成、数据库操作、测试、部署等

## PRD 文档规范

在 `prd/` 目录下，建议按功能模块或版本组织文档，例如：

```
prd/
├── v1.0/
│   ├── 用户登录模块.md
│   ├── 首页功能.md
│   └── 数据展示模块.md
├── v2.0/
│   ├── 新功能模块.md
│   └── 优化改进.md
└── 模板/
    ├── PRD模板.md
    └── 用户故事模板.md
```