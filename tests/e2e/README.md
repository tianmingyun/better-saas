# E2E 端到端测试文档

本文档详细介绍了 Better SaaS 项目的端到端测试架构、使用方法和最佳实践。

## 📋 目录

- [测试架构概览](#测试架构概览)
- [快速开始](#快速开始)
- [测试结构](#测试结构)
- [运行测试](#运行测试)
- [测试工具和辅助函数](#测试工具和辅助函数)
- [最佳实践](#最佳实践)
- [CI/CD 集成](#cicd-集成)
- [故障排除](#故障排除)

## 🏗️ 测试架构概览

### 技术栈

- **测试框架**: Playwright
- **语言**: TypeScript
- **测试运行器**: Playwright Test Runner
- **报告**: HTML、JSON、JUnit
- **浏览器**: Chromium、Firefox、Safari (可配置)

### 测试分层

```
tests/e2e/
├── auth/                    # 认证相关测试
│   ├── login.spec.ts       # 登录功能测试
│   └── signup.spec.ts      # 注册功能测试
├── admin/                   # 管理员功能测试
│   └── user-management.spec.ts  # 用户管理测试
├── dashboard/               # 仪表板功能测试
│   ├── navigation.spec.ts  # 导航测试
│   └── file-management.spec.ts  # 文件管理测试
├── settings/                # 设置页面测试
│   └── profile.spec.ts     # 个人资料测试
├── payment/                 # 支付相关测试
│   └── billing.spec.ts     # 账单管理测试
├── i18n/                   # 国际化测试
│   └── internationalization.spec.ts  # 多语言测试
├── utils/                  # 测试工具
│   └── test-helpers.ts     # 测试辅助函数
├── fixtures/               # 测试夹具
│   └── test-setup.ts       # 测试设置
└── README.md               # 本文档
```

## 🚀 快速开始

### 前置条件

1. **Node.js**: 版本 18 或更高
2. **pnpm**: 项目包管理器
3. **应用程序**: 确保应用在 `http://localhost:3000` 运行

### 安装依赖

```bash
# 安装项目依赖
pnpm install

# 安装 Playwright 浏览器
pnpm playwright install
```

### 环境配置

创建测试环境变量文件：

```bash
# .env.test
DATABASE_URL="postgresql://test_user:test_password@localhost:5432/test_db"
BETTER_AUTH_SECRET="test-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_EMAILS="admin@test.com"
```

### 运行第一个测试

```bash
# 运行所有 E2E 测试
pnpm test:e2e

# 运行特定测试文件
pnpm test:e2e tests/e2e/auth/login.spec.ts

# 以头部模式运行（显示浏览器）
pnpm test:e2e:headed

# 运行测试并显示 UI
pnpm test:e2e:ui
```

## 📁 测试结构

### 测试文件组织

每个测试文件按功能模块组织，包含多个测试组：

```typescript
test.describe('功能模块测试', () => {
  test.beforeEach(async ({ page, authHelper }) => {
    // 测试前置设置
  });

  test.describe('子功能组', () => {
    test('具体测试用例', async ({ page, assertionHelper }) => {
      // 测试步骤
    });
  });
});
```

### 测试覆盖范围

#### 认证测试 (`auth/`)
- ✅ 邮箱密码登录
- ✅ OAuth 登录 (GitHub, Google)
- ✅ 用户注册
- ✅ 密码重置
- ✅ 会话管理
- ✅ 权限验证

#### 仪表板测试 (`dashboard/`)
- ✅ 导航功能
- ✅ 侧边栏交互
- ✅ 主题切换
- ✅ 响应式设计
- ✅ 快捷键支持

#### 管理员功能测试 (`admin/`)
- ✅ 用户列表显示
- ✅ 用户搜索和过滤
- ✅ 用户操作 (编辑、禁用、删除)
- ✅ 批量操作
- ✅ 权限控制

#### 文件管理测试 (`dashboard/`)
- ✅ 文件上传 (拖拽、点击)
- ✅ 文件预览
- ✅ 文件操作 (重命名、删除、下载)
- ✅ 文件夹管理
- ✅ 存储空间管理

#### 设置页面测试 (`settings/`)
- ✅ 个人资料编辑
- ✅ 头像上传和裁剪
- ✅ 账户偏好设置
- ✅ 数据导出
- ✅ 账户删除

#### 支付功能测试 (`payment/`)
- ✅ 订阅管理
- ✅ 支付方式管理
- ✅ 账单历史
- ✅ 使用量监控
- ✅ 优惠券系统

#### 国际化测试 (`i18n/`)
- ✅ 语言切换
- ✅ 本地化内容
- ✅ 数字和日期格式化
- ✅ 错误消息本地化
- ✅ SEO 元数据本地化

## 🏃 运行测试

### 基本命令

```bash
# 运行所有 E2E 测试
pnpm test:e2e

# 运行特定测试文件
pnpm test:e2e auth/login.spec.ts

# 运行特定测试组
pnpm test:e2e --grep "登录功能"

# 并行运行测试
pnpm test:e2e --workers=4

# 重试失败的测试
pnpm test:e2e --retries=2
```

### 调试模式

```bash
# 显示浏览器窗口
pnpm test:e2e:headed

# 启动调试 UI
pnpm test:e2e:ui

# 单步调试
pnpm test:e2e --debug

# 生成测试代码
pnpm playwright codegen http://localhost:3000
```

### 不同浏览器测试

```bash
# 在 Chrome 中运行
pnpm test:e2e --project=chromium

# 在 Firefox 中运行
pnpm test:e2e --project=firefox

# 在 Safari 中运行
pnpm test:e2e --project=webkit

# 在所有浏览器中运行
pnpm test:e2e --project=chromium --project=firefox --project=webkit
```

### 移动端测试

```bash
# 模拟移动设备
pnpm test:e2e --project="Mobile Chrome"
pnpm test:e2e --project="Mobile Safari"
```

## 🛠️ 测试工具和辅助函数

### 测试夹具 (Fixtures)

项目使用自定义测试夹具提供常用功能：

```typescript
import { test } from '../fixtures/test-setup';

test('测试用例', async ({ 
  page,           // Playwright Page 对象
  authHelper,     // 认证辅助函数
  navigationHelper, // 导航辅助函数
  formHelper,     // 表单辅助函数
  waitHelper,     // 等待辅助函数
  assertionHelper, // 断言辅助函数
  screenshotHelper // 截图辅助函数
}) => {
  // 测试代码
});
```

### 认证辅助函数 (AuthHelper)

```typescript
// 管理员登录
await authHelper.loginAsAdmin();

// 普通用户登录
await authHelper.loginAsUser();

// 自定义登录
await authHelper.loginWithEmail('user@example.com', 'password');

// 退出登录
await authHelper.logout();

// 检查登录状态
const isLoggedIn = await authHelper.isLoggedIn();
```

### 导航辅助函数 (NavigationHelper)

```typescript
// 导航到仪表板
await navigationHelper.goToDashboard();

// 导航到用户管理
await navigationHelper.goToUserManagement();

// 切换语言
await navigationHelper.switchLanguage('en');
```

### 表单辅助函数 (FormHelper)

```typescript
// 填写表单
await formHelper.fillForm({
  '[data-testid="name-input"]': 'John Doe',
  '[data-testid="email-input"]': 'john@example.com'
});

// 提交表单
await formHelper.submitForm('[data-testid="submit-button"]');

// 等待成功消息
await formHelper.waitForSuccessMessage('保存成功');

// 等待错误消息
await formHelper.waitForErrorMessage('验证失败');
```

### 等待辅助函数 (WaitHelper)

```typescript
// 等待加载完成
await waitHelper.waitForLoadingComplete();

// 等待元素出现
await waitHelper.waitForElement('[data-testid="modal"]');

// 等待 API 响应
await waitHelper.waitForApiResponse('**/api/users**');
```

### 断言辅助函数 (AssertionHelper)

```typescript
// 断言元素可见
await assertionHelper.assertElementVisible('[data-testid="button"]');

// 断言文本内容
await assertionHelper.assertTextContent('[data-testid="title"]', '标题');

// 断言 URL
await assertionHelper.assertUrl('/dashboard');

// 断言元素数量
await assertionHelper.assertElementCount('[data-testid="item"]', 5);
```

## 📝 最佳实践

### 1. 测试数据管理

```typescript
// ✅ 使用测试常量
import { TEST_USERS } from '../utils/test-helpers';

// ✅ 生成唯一测试数据
const testEmail = `test-${Date.now()}@example.com`;

// ❌ 避免硬编码数据
const email = 'hardcoded@example.com';
```

### 2. 选择器策略

```typescript
// ✅ 使用 data-testid
await page.click('[data-testid="submit-button"]');

// ✅ 使用语义化选择器
await page.click('button:has-text("提交")');

// ❌ 避免使用 CSS 类名
await page.click('.btn-primary');

// ❌ 避免使用复杂的 CSS 选择器
await page.click('div > ul > li:nth-child(3) > a');
```

### 3. 等待策略

```typescript
// ✅ 等待特定条件
await page.waitForSelector('[data-testid="success-message"]');

// ✅ 等待网络请求
await page.waitForResponse('**/api/save');

// ✅ 等待 URL 变化
await page.waitForURL('/dashboard');

// ❌ 避免固定时间等待
await page.waitForTimeout(5000);
```

### 4. 错误处理

```typescript
// ✅ 使用 try-catch 处理预期错误
try {
  await page.click('[data-testid="delete-button"]');
  await page.waitForSelector('[data-testid="confirm-dialog"]');
} catch (error) {
  console.error('Delete button not found:', error);
}

// ✅ 验证错误状态
await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
```

### 5. 测试隔离

```typescript
test.beforeEach(async ({ page }) => {
  // ✅ 清除状态
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});
```

### 6. 并行测试优化

```typescript
// ✅ 使用独立的测试数据
test('用户注册', async ({ page }) => {
  const uniqueEmail = `user-${test.info().workerIndex}-${Date.now()}@test.com`;
  // 测试代码
});

// ✅ 避免共享状态
test.describe.configure({ mode: 'parallel' });
```

## 🔄 CI/CD 集成

### GitHub Actions 配置

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright
        run: pnpm playwright install --with-deps
      
      - name: Start application
        run: |
          pnpm build
          pnpm start &
          sleep 10
      
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          CI: true
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Docker 环境

```dockerfile
# Dockerfile.e2e
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "run", "test:e2e"]
```

## 🐛 故障排除

### 常见问题

#### 1. 测试超时

```bash
# 增加超时时间
pnpm test:e2e --timeout=60000

# 或在配置文件中设置
# playwright.config.ts
export default defineConfig({
  timeout: 60000,
});
```

#### 2. 元素未找到

```typescript
// 增加等待时间
await page.waitForSelector('[data-testid="element"]', { timeout: 10000 });

// 检查元素是否存在
const element = await page.locator('[data-testid="element"]');
await expect(element).toBeVisible();
```

#### 3. 网络请求失败

```typescript
// 模拟网络响应
await page.route('**/api/endpoint', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ success: true })
  });
});
```

#### 4. 浏览器启动失败

```bash
# 重新安装浏览器
pnpm playwright install

# 使用系统浏览器
pnpm test:e2e --headed
```

### 调试技巧

#### 1. 截图调试

```typescript
// 在失败时自动截图
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    await page.screenshot({ 
      path: `test-results/failure-${testInfo.title}-${Date.now()}.png`,
      fullPage: true 
    });
  }
});
```

#### 2. 控制台日志

```typescript
// 监听控制台消息
page.on('console', msg => {
  console.log('Browser console:', msg.text());
});

// 监听页面错误
page.on('pageerror', error => {
  console.error('Page error:', error.message);
});
```

#### 3. 网络监控

```typescript
// 监听网络请求
page.on('request', request => {
  console.log('Request:', request.url());
});

page.on('response', response => {
  console.log('Response:', response.url(), response.status());
});
```

## 📊 测试报告

### HTML 报告

```bash
# 生成 HTML 报告
pnpm test:e2e --reporter=html

# 查看报告
pnpm playwright show-report
```

### 自定义报告

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
});
```

## 🔧 配置选项

### Playwright 配置

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 📚 参考资源

- [Playwright 官方文档](https://playwright.dev/)
- [测试最佳实践](https://playwright.dev/docs/best-practices)
- [页面对象模型](https://playwright.dev/docs/pom)
- [CI/CD 集成指南](https://playwright.dev/docs/ci)

## 🤝 贡献指南

### 添加新测试

1. 在相应的模块目录下创建测试文件
2. 使用统一的命名约定：`功能.spec.ts`
3. 遵循现有的测试结构和模式
4. 添加适当的注释和文档
5. 确保测试具有良好的隔离性

### 更新测试工具

1. 在 `utils/test-helpers.ts` 中添加新的辅助函数
2. 在 `fixtures/test-setup.ts` 中注册新的夹具
3. 更新相关文档和示例

### 报告问题

如果发现测试相关的问题，请在 GitHub Issues 中报告，包含：

- 问题描述
- 复现步骤
- 期望行为
- 实际行为
- 环境信息 (OS, Node.js 版本, 浏览器版本)

---

**最后更新**: 2024年1月
**维护者**: Better SaaS 团队 