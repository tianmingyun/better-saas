import { test, expect } from '../fixtures/test-setup';
import { TEST_USERS } from '../utils/test-helpers';

test.describe('登录调试测试', () => {
  test.beforeEach(async ({ page }) => {
    // 清除所有状态
    await page.context().clearCookies();
    // 先导航到一个页面，然后清除存储
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('调试登录流程', async ({ page }) => {
    console.log('开始调试登录流程...');
    
    // 1. 导航到登录页面
    await page.goto('/login');
    console.log('已导航到登录页面');
    
    // 2. 检查页面元素
    const loginForm = await page.locator('[data-testid="login-form"]').isVisible();
    console.log('登录表单可见:', loginForm);
    
    const emailInput = await page.locator('[data-testid="email-input"]').isVisible();
    console.log('邮箱输入框可见:', emailInput);
    
    const passwordInput = await page.locator('[data-testid="password-input"]').isVisible();
    console.log('密码输入框可见:', passwordInput);
    
    const loginButton = await page.locator('[data-testid="login-button"]').isVisible();
    console.log('登录按钮可见:', loginButton);
    
    // 3. 填写登录信息
    await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
    console.log('已填写邮箱:', TEST_USERS.admin.email);
    
    await page.fill('[data-testid="password-input"]', TEST_USERS.admin.password);
    console.log('已填写密码');
    
    // 4. 点击登录按钮
    console.log('准备点击登录按钮...');
    await page.click('[data-testid="login-button"]');
    console.log('已点击登录按钮');
    
    // 5. 等待一段时间并检查页面状态
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('当前URL:', currentUrl);
    
    // 检查是否有错误消息
    const errorMessages = await page.locator('.text-red-600, .text-red-500, [role="alert"]').allTextContents();
    if (errorMessages.length > 0) {
      console.log('错误消息:', errorMessages);
    }
    
    // 检查是否有加载状态
    const loadingElements = await page.locator('[data-loading="true"], .loading, .spinner').count();
    console.log('加载元素数量:', loadingElements);
    
    // 检查网络请求
    page.on('response', response => {
      if (response.url().includes('/api/auth') || response.url().includes('auth')) {
        console.log('认证相关请求:', response.url(), response.status());
      }
    });
    
    // 等待更长时间看看是否有重定向
    await page.waitForTimeout(5000);
    console.log('最终URL:', page.url());
  });

  test('尝试注册新用户', async ({ page }) => {
    console.log('开始注册新用户...');
    
    // 生成唯一邮箱
    const uniqueEmail = `test-${Date.now()}@test.com`;
    
    await page.goto('/signup');
    console.log('已导航到注册页面');
    
    // 检查注册表单
    const signupForm = await page.locator('[data-testid="signup-form"]').isVisible();
    console.log('注册表单可见:', signupForm);
    
    if (signupForm) {
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', uniqueEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
      
      console.log('已填写注册信息:', uniqueEmail);
      
      await page.click('[data-testid="signup-button"]');
      console.log('已点击注册按钮');
      
      await page.waitForTimeout(5000);
      console.log('注册后URL:', page.url());
      
      // 检查是否有错误消息
      const errorMessages = await page.locator('.text-red-600, .text-red-500, [role="alert"]').allTextContents();
      if (errorMessages.length > 0) {
        console.log('注册错误消息:', errorMessages);
      }
    }
  });
}); 