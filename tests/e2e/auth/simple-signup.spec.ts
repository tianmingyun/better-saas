import { test, expect } from '../fixtures/test-setup';

test.describe('简单注册测试', () => {
  test.beforeEach(async ({ page }) => {
    // 清除所有状态
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('注册新用户', async ({ page }) => {
    // 生成唯一邮箱
    const uniqueEmail = `test-${Date.now()}@test.com`;
    const password = 'TestPassword123!';
    const name = 'Test User';

    console.log('注册用户:', uniqueEmail);

    // 导航到注册页面
    await page.goto('/signup');

    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 检查注册表单是否存在
    const signupForm = page.locator('[data-testid="signup-form"]');
    await expect(signupForm).toBeVisible();

    // 填写注册信息
    await page.fill('[data-testid="name-input"]', name);
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', password);
    await page.fill('[data-testid="confirm-password-input"]', password);

    // 点击注册按钮
    await page.click('[data-testid="signup-button"]');

    // 等待一段时间
    await page.waitForTimeout(5000);

    console.log('注册后的URL:', page.url());

    // 检查是否有任何错误消息
    const errorElements = await page.locator('.text-red-600, .text-red-500, [role="alert"]').all();
    for (const element of errorElements) {
      const text = await element.textContent();
      if (text && text.trim()) {
        console.log('错误消息:', text);
      }
    }

    // 检查是否成功重定向或显示成功消息
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/settings')) {
      console.log('注册成功，已重定向到:', currentUrl);
    } else {
      console.log('注册可能失败，仍在:', currentUrl);
    }
  });

  test('测试登录现有用户', async ({ page }) => {
    // 使用预设的测试用户
    const email = 'admin@test.com';
    const password = 'TestPassword123!';

    console.log('尝试登录用户:', email);

    // 导航到登录页面
    await page.goto('/login');

    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 检查登录表单是否存在
    const loginForm = page.locator('[data-testid="login-form"]');
    await expect(loginForm).toBeVisible();

    // 填写登录信息
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);

    // 点击登录按钮
    await page.click('[data-testid="login-button"]');

    // 等待一段时间
    await page.waitForTimeout(5000);

    console.log('登录后的URL:', page.url());

    // 检查是否有任何错误消息
    const errorElements = await page.locator('.text-red-600, .text-red-500, [role="alert"]').all();
    for (const element of errorElements) {
      const text = await element.textContent();
      if (text && text.trim()) {
        console.log('登录错误消息:', text);
      }
    }

    // 检查是否成功重定向
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/settings')) {
      console.log('登录成功，已重定向到:', currentUrl);
    } else {
      console.log('登录可能失败，仍在:', currentUrl);
    }
  });
}); 