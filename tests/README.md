# 测试架构文档

本文档详细介绍了 Better SaaS 项目的测试架构、集成测试改进方案以及测试覆盖率优化策略。

## 📋 目录

- [测试架构概览](#测试架构概览)
- [__mocks__ 目录分析](#__mocks__-目录分析)
- [集成测试改进](#集成测试改进)
- [测试覆盖率优化](#测试覆盖率优化)
- [运行测试](#运行测试)
- [最佳实践](#最佳实践)

## 🏗️ 测试架构概览

### 测试类型分层

```
tests/
├── unit/                    # 单元测试
│   ├── components/         # React 组件测试
│   ├── hooks/              # 自定义 Hook 测试
│   ├── lib/                # 工具函数测试
│   ├── server/             # 服务端逻辑测试
│   └── store/              # 状态管理测试
├── integration/            # 集成测试
│   ├── api/                # API 集成测试
│   ├── database/           # 数据库集成测试
│   └── services/           # 服务集成测试
├── e2e/                    # 端到端测试
│   ├── admin/              # 管理员功能测试
│   ├── auth/               # 认证流程测试
│   ├── dashboard/          # 仪表板测试
│   └── payment/            # 支付流程测试
├── performance/            # 性能测试
├── security/               # 安全测试
├── setup/                  # 测试配置
├── utils/                  # 测试工具
└── __mocks__/              # Mock 文件
```

### 测试环境配置

- **单元测试**: jsdom 环境，适合 React 组件和前端逻辑
- **集成测试**: Node.js 环境，适合 API 和数据库测试
- **E2E 测试**: Playwright 浏览器环境

## 📁 __mocks__ 目录分析

### 作用和重要性

`tests/__mocks__/fileMock.js` 文件在测试架构中扮演重要角色：

#### ✅ 保留的原因

1. **静态资源处理**: Jest 无法直接处理图片等静态资源，需要 Mock 文件替代
2. **测试性能**: 避免在测试中加载真实的大文件，提高测试速度
3. **Jest 配置依赖**: `jest.config.js` 中的 `moduleNameMapper` 明确引用此文件
4. **标准实践**: 这是 Jest 测试环境的标准做法

#### 📝 文件内容

```javascript
module.exports = 'test-file-stub'
```

#### 🔧 使用方式

在 Jest 配置中通过 `moduleNameMapper` 映射：

```javascript
moduleNameMapper: {
  '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
}
```

### ❌ 不建议删除

删除此文件会导致：
- 涉及图片导入的组件测试失败
- Jest 无法正确处理静态资源引用
- 测试环境配置错误

## 🔧 集成测试改进

### 问题分析

原有集成测试存在以下问题：

1. **过度 Mock**: 大量使用 Mock，更像单元测试而非集成测试
2. **缺乏真实集成**: 没有测试真实的 API 路由和数据库交互
3. **覆盖范围有限**: 只测试基础 CRUD，缺乏复杂业务场景

### 改进方案

#### 1. 真实 API 集成测试

新增 `tests/integration/api/` 目录，包含：

- **认证 API 测试** (`auth-api.test.ts`)
  - 用户注册/登录流程
  - 会话管理
  - 权限验证
  - 错误处理

- **文件管理 API 测试** (`file-api.test.ts`)
  - 文件上传/下载
  - 文件列表和搜索
  - 权限控制
  - 文件删除

#### 2. 真实数据库集成测试

新增 `tests/integration/database/real-database.test.ts`：

- 使用真实的 Drizzle ORM 连接
- 测试复杂查询和关联关系
- 事务处理测试
- 数据完整性验证

#### 3. 测试环境隔离

- 使用独立的测试数据库
- 每个测试前后自动清理数据
- 提供测试数据工厂函数

### 新增测试文件

#### 认证 API 集成测试

```typescript
// tests/integration/api/auth-api.test.ts
describe('Authentication API Integration Tests', () => {
  // 测试用户注册、登录、会话管理等完整流程
  // 使用真实的 Next.js 服务器和数据库
});
```

#### 文件管理 API 集成测试

```typescript
// tests/integration/api/file-api.test.ts
describe('File Management API Integration Tests', () => {
  // 测试文件上传、下载、权限控制等
  // 包含文件大小限制、类型验证等边界测试
});
```

#### 真实数据库集成测试

```typescript
// tests/integration/database/real-database.test.ts
describe('Real Database Integration Tests', () => {
  // 使用真实的 Drizzle ORM 和 PostgreSQL
  // 测试复杂查询、事务、关联关系等
});
```

## 📊 测试覆盖率优化

### 配置改进

#### Jest 配置优化

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 75,
    functions: 80,
    lines: 85,
    statements: 85,
  },
  // 关键模块的更高要求
  'src/lib/auth/**/*.{js,jsx,ts,tsx}': {
    branches: 85,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}
```

#### 测试环境分离

- **单元测试**: jsdom 环境，超时 30 秒
- **集成测试**: Node.js 环境，超时 60 秒
- **并行运行**: 支持同时运行不同类型的测试

### 覆盖率报告工具

新增 `tests/scripts/test-coverage-report.js`：

#### 功能特性

- 🎯 **智能分析**: 自动识别关键文件和低覆盖率区域
- 📊 **详细报告**: 提供行、函数、分支、语句覆盖率统计
- 💡 **改进建议**: 基于覆盖率数据提供具体的改进建议
- 🎨 **彩色输出**: 使用颜色区分不同覆盖率等级

#### 使用方法

```bash
# 运行覆盖率分析
node tests/scripts/test-coverage-report.js

# 或通过 npm 脚本
pnpm run test:coverage:report
```

#### 报告内容

1. **整体覆盖率统计**
2. **文件分类分析**
3. **关键文件低覆盖率警告**
4. **改进建议和行动计划**
5. **有用的命令提示**

### 覆盖率目标

| 类型 | 目标覆盖率 | 说明 |
|------|------------|------|
| 整体 | 85% | 项目整体行覆盖率目标 |
| 认证模块 | 90% | 安全相关，要求更高覆盖率 |
| 文件服务 | 85% | 核心业务逻辑 |
| API Actions | 85% | 服务端业务逻辑 |
| 分支覆盖率 | 75% | 条件逻辑覆盖 |
| 函数覆盖率 | 80% | 函数调用覆盖 |

## 🚀 运行测试

### 基础命令

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:unit

# 运行集成测试
pnpm test:integration

# 运行 E2E 测试
pnpm test:e2e

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 监听模式运行测试
pnpm test:watch
```

### 高级命令

```bash
# 运行特定测试文件
pnpm test auth-api.test.ts

# 运行特定测试套件
pnpm test --testNamePattern="Authentication"

# 运行覆盖率分析报告
node tests/scripts/test-coverage-report.js

# 运行安全测试
pnpm test:security

# 运行性能测试
pnpm test:performance
```

### CI/CD 集成

```yaml
# .github/workflows/test.yml
- name: Run tests with coverage
  run: pnpm test:coverage

- name: Upload coverage reports
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## 📋 最佳实践

### 1. 测试编写原则

#### AAA 模式 (Arrange-Act-Assert)

```typescript
it('should create user successfully', async () => {
  // Arrange - 准备测试数据
  const userData = { email: 'test@example.com', name: 'Test User' };
  
  // Act - 执行被测试的操作
  const result = await createUser(userData);
  
  // Assert - 验证结果
  expect(result.success).toBe(true);
  expect(result.user.email).toBe(userData.email);
});
```

#### 测试命名规范

- ✅ **描述性**: `should create user with valid data`
- ✅ **行为导向**: `should reject invalid email format`
- ❌ **技术导向**: `test createUser function`

### 2. Mock 使用指南

#### 何时使用 Mock

- 外部 API 调用
- 数据库连接（单元测试）
- 文件系统操作
- 时间相关函数

#### 何时避免 Mock

- 集成测试中的核心业务逻辑
- 简单的纯函数
- 测试目标本身的功能

### 3. 集成测试策略

#### 数据隔离

```typescript
beforeEach(async () => {
  // 每个测试前清理数据
  await cleanupTestData();
});

afterAll(async () => {
  // 测试结束后清理
  await cleanupTestData();
});
```

#### 测试数据工厂

```typescript
// 使用工厂函数创建测试数据
const testUser = createTestUser({ 
  email: 'specific@example.com' 
});
```

### 4. 性能考虑

- 🚀 **并行运行**: 使用 Jest 的并行能力
- 🎯 **测试隔离**: 避免测试间的依赖
- 💾 **数据清理**: 及时清理测试数据
- ⏱️ **超时设置**: 合理设置测试超时时间

### 5. 维护性原则

- 📝 **清晰的测试名称**
- 🔄 **DRY 原则**: 复用测试工具函数
- 📚 **文档化**: 为复杂测试添加注释
- 🧹 **定期重构**: 保持测试代码质量

## 🎯 下一步计划

### 短期目标 (1-2 周)

1. ✅ 完善现有集成测试
2. ✅ 提高关键模块测试覆盖率
3. 🔄 设置 CI/CD 覆盖率检查
4. 📝 编写测试文档

### 中期目标 (1 个月)

1. 🎭 引入 Mutation Testing
2. 🔄 自动化测试报告
3. 📊 测试性能监控
4. 🛡️ 增强安全测试

### 长期目标 (3 个月)

1. 🤖 AI 辅助测试生成
2. 📈 测试指标仪表板
3. 🔍 代码质量门禁
4. 📚 测试最佳实践培训

## 📞 支持和反馈

如有测试相关问题或建议，请：

1. 📝 创建 Issue 描述问题
2. 💬 在团队讨论中提出
3. 📖 查阅本文档获取指导
4. 🔍 参考现有测试用例

---

**记住**: 好的测试不仅能发现 bug，更能提高代码质量和开发效率！🚀 