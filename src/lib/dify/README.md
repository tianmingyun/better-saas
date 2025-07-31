# Dify集成的环境变量配置

## 在Vercel中设置环境变量

**必需的环境变量：**
- `DIFY_API_KEY` - 从Dify控制台获取的API密钥
- `DIFY_BASE_URL` - 可选，默认为 `https://api.dify.ai/v1`

**可选的环境变量：**
- `DIFY_APP_ID` - 特定Dify应用的ID（如需要）

## 如何配置

### 在Vercel项目中设置
1. 进入 Vercel Dashboard
2. 选择项目 → Settings → Environment Variables
3. 添加 `DIFY_API_KEY` 和 `DIFY_BASE_URL`

### 在本地开发环境
创建 `.env.local` 文件：
```
DIFY_API_KEY=your_dify_api_key_here
DIFY_BASE_URL=https://api.dify.ai/v1
```

## 安全注意事项

- **不要在代码中硬编码API密钥**
- **不要将API密钥提交到Git仓库**
- **使用GitHub Secrets或Vercel环境变量管理密钥**

## 验证配置

在Vercel部署日志中可以查看配置验证信息：
- ✅ 提示表示配置正确
- ⚠️ 警告表示环境变量缺失