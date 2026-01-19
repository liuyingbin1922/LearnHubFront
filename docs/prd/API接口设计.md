# API接口设计文档

## API概览

### 基本信息
- **基础URL**：`http://localhost:8000/api/v1`
- **认证方式**：JWT Token (预留，目前可跳过)
- **请求格式**：JSON
- **响应格式**：JSON
- **字符编码**：UTF-8

### 通用响应格式
```typescript
// 成功响应
{
  "success": true,
  "data": {}, // 实际数据
  "message": "操作成功"
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### HTTP状态码
- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权
- `404` - 资源不存在
- `500` - 服务器内部错误

## 错题集管理 API

### 1. 创建错题集
**接口地址**：`POST /collections`

**请求参数**：
```json
{
  "name": "高一数学-函数",
  "description": "函数相关错题集合"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "高一数学-函数",
    "description": "函数相关错题集合",
    "problem_count": 0,
    "created_at": "2026-01-13T10:00:00Z",
    "updated_at": "2026-01-13T10:00:00Z"
  }
}
```

### 2. 获取错题集列表
**接口地址**：`GET /collections`

**查询参数**：
- `page` (可选) - 页码，默认1
- `size` (可选) - 每页数量，默认20
- `search` (可选) - 搜索关键词

**响应示例**：
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "id": 1,
        "name": "高一数学-函数",
        "description": "函数相关错题集合",
        "problem_count": 15,
        "created_at": "2026-01-13T10:00:00Z",
        "updated_at": "2026-01-13T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### 3. 获取错题集详情
**接口地址**：`GET /collections/{id}`

**路径参数**：
- `id` - 错题集ID

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "高一数学-函数",
    "description": "函数相关错题集合",
    "problem_count": 15,
    "created_at": "2026-01-13T10:00:00Z",
    "updated_at": "2026-01-13T10:00:00Z"
  }
}
```

### 4. 更新错题集
**接口地址**：`PUT /collections/{id}`

**路径参数**：
- `id` - 错题集ID

**请求参数**：
```json
{
  "name": "高一数学-函数专题",
  "description": "函数相关错题集合-更新版"
}
```

### 5. 删除错题集
**接口地址**：`DELETE /collections/{id}`

**路径参数**：
- `id` - 错题集ID

**响应示例**：
```json
{
  "success": true,
  "message": "错题集已删除"
}
```

## 图片上传 API

### 1. 上传图片
**接口地址**：`POST /upload`

**请求类型**：`multipart/form-data`

**请求参数**：
- `file` (必需) - 图片文件，支持jpg、png、webp
- `type` (可选) - 图片类型：original/cropped，默认original

**响应示例**：
```json
{
  "success": true,
  "data": {
    "url": "http://minio:9000/bucket/uuid.jpg",
    "filename": "uuid.jpg",
    "size": 1024000,
    "width": 1080,
    "height": 1920
  }
}
```

**错误情况**：
- 文件过大 (>10MB)：返回400错误
- 不支持的文件格式：返回400错误
- 上传失败：返回500错误

## OCR识别 API

### 1. OCR识别
**接口地址**：`POST /ocr`

**请求参数**：
```json
{
  "image_url": "http://minio:9000/bucket/uuid.jpg",
  "language": "CHN_ENG"  // 可选：CHN_ENG(中英文)、ENG(英文)
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "text": "已知函数f(x) = ax² + bx + c，求...",
    "confidence": 0.95,
    "words": [
      {
        "text": "已知函数",
        "confidence": 0.98
      },
      {
        "text": "f(x) = ax² + bx + c",
        "confidence": 0.92
      }
    ]
  }
}
```

**错误情况**：
- 图片不存在：返回404错误
- OCR识别失败：返回500错误
- 图片格式不支持：返回400错误

## 错题管理 API

### 1. 创建错题
**接口地址**：`POST /problems`

**请求参数**：
```json
{
  "collection_id": 1,
  "original_image_url": "http://minio:9000/bucket/original.jpg",
  "cropped_image_url": "http://minio:9000/bucket/cropped.jpg",
  "ocr_text": "已知函数f(x) = ax² + bx + c，求...",
  "note": "未掌握二次函数的顶点坐标公式",
  "tags": ["函数", "二次函数", "基础题"],
  "difficulty": 2,
  "source": "2025年高考真题",
  "subject": "数学"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "collection_id": 1,
    "original_image_url": "http://minio:9000/bucket/original.jpg",
    "cropped_image_url": "http://minio:9000/bucket/cropped.jpg",
    "ocr_text": "已知函数f(x) = ax² + bx + c，求...",
    "note": "未掌握二次函数的顶点坐标公式",
    "tags": ["函数", "二次函数", "基础题"],
    "order_index": 0,
    "created_at": "2026-01-13T10:00:00Z",
    "updated_at": "2026-01-13T10:00:00Z"
  }
}
```

### 2. 获取错题列表
**接口地址**：`GET /collections/{collection_id}/problems`

**路径参数**：
- `collection_id` - 错题集ID

**查询参数**：
- `page` (可选) - 页码，默认1
- `size` (可选) - 每页数量，默认20
- `tag` (可选) - 按标签筛选
- `search` (可选) - 搜索关键词

**响应示例**：
```json
{
  "success": true,
  "data": {
    "problems": [
      {
        "id": 1,
        "cropped_image_url": "http://minio:9000/bucket/cropped.jpg",
        "ocr_text": "已知函数f(x) = ax² + bx + c，求...",
        "note": "未掌握二次函数的顶点坐标公式",
        "tags": ["函数", "二次函数"],
        "created_at": "2026-01-13T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 15,
      "pages": 1
    }
  }
}
```

### 3. 获取错题详情
**接口地址**：`GET /problems/{id}`

**路径参数**：
- `id` - 错题ID

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "collection_id": 1,
    "original_image_url": "http://minio:9000/bucket/original.jpg",
    "cropped_image_url": "http://minio:9000/bucket/cropped.jpg",
    "ocr_text": "已知函数f(x) = ax² + bx + c，求...",
    "note": "未掌握二次函数的顶点坐标公式",
    "tags": ["函数", "二次函数"],
    "difficulty": 2,
    "source": "2025年高考真题",
    "subject": "数学",
    "created_at": "2026-01-13T10:00:00Z",
    "updated_at": "2026-01-13T10:00:00Z"
  }
}
```

### 4. 更新错题
**接口地址**：`PUT /problems/{id}`

**路径参数**：
- `id` - 错题ID

**请求参数**：
```json
{
  "ocr_text": "已知函数f(x) = ax² + bx + c，求函数的最小值",
  "note": "已掌握，利用顶点坐标公式(-b/2a, (4ac-b²)/4a)",
  "tags": ["函数", "二次函数", "最值"]
}
```

### 5. 删除错题
**接口地址**：`DELETE /problems/{id}`

**路径参数**：
- `id` - 错题ID

### 6. 批量操作错题
**接口地址**：`POST /problems/batch`

**请求参数**：
```json
{
  "action": "move",  // move/delete/add_tag
  "problem_ids": [1, 2, 3],
  "target_collection_id": 2,  // 当action=move时必需
  "tag": "重点题"  // 当action=add_tag时必需
}
```

## PDF导出 API

### 1. 导出PDF
**接口地址**：`GET /collections/{id}/export.pdf`

**路径参数**：
- `id` - 错题集ID

**查询参数**：
- `layout` (可选) - 布局：single(单题)/double(双题)，默认single
- `include_ocr` (可选) - 是否包含OCR文本，true/false，默认true
- `include_note` (可选) - 是否包含备注，true/false，默认true
- `paper_size` (可选) - 纸张大小：A4/A3，默认A4

**响应**：
- 成功：返回PDF文件流
- 失败：返回错误JSON

**响应头**：
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="错题集_高一数学-函数.pdf"
```

**示例代码**：
```javascript
// 前端调用示例
const exportPDF = async (collectionId) => {
  const response = await fetch(
    `/api/collections/${collectionId}/export.pdf?layout=single&include_ocr=true`,
    {
      method: 'GET'
    }
  );

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `错题集_${collectionId}.pdf`;
  a.click();
};
```

## 错误码定义

### 系统错误码
- `SYSTEM_ERROR` - 系统内部错误
- `INVALID_REQUEST` - 请求参数无效
- `UNAUTHORIZED` - 未授权访问
- `FORBIDDEN` - 禁止访问
- `NOT_FOUND` - 资源不存在

### 业务错误码
- `COLLECTION_NOT_FOUND` - 错题集不存在
- `PROBLEM_NOT_FOUND` - 错题不存在
- `UPLOAD_FAILED` - 文件上传失败
- `OCR_FAILED` - OCR识别失败
- `PDF_GENERATION_FAILED` - PDF生成失败

## 接口限制

### 请求限制
- 图片上传大小：10MB
- OCR并发请求：5个/用户
- PDF导出最大题数：500题
- API调用频率：100次/分钟/用户

### 超时设置
- 图片上传：60秒
- OCR识别：30秒
- PDF生成：120秒
- 其他接口：10秒

---

**API版本**：v1.0.0
**最后更新**：2026-01-13
**负责人**：后端开发团队