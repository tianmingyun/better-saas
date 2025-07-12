import { test } from '../fixtures/test-setup';
import { TEST_USERS } from '../utils/test-helpers';

test.describe('创建测试用户', () => {
  test.beforeEach(async ({ page }) => {
    // 清除所有状态
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('创建管理员用户', async ({ page }) => {
    const userData = TEST_USERS.admin;
    console.log('创建管理员用户:', userData.email);

    // 导航到注册页面
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // 填写注册信息
    await page.fill('[data-testid="name-input"]', userData.name);
    await page.fill('[data-testid="email-input"]', userData.email);
    await page.fill('[data-testid="password-input"]', userData.password);
    await page.fill('[data-testid="confirm-password-input"]', userData.password);

    // 点击注册按钮
    await page.click('[data-testid="signup-button"]');

    // 等待重定向
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('管理员注册后URL:', currentUrl);

    if (currentUrl.includes('/dashboard') || currentUrl.includes('/settings')) {
      console.log('✅ 管理员用户创建成功');
    } else {
      console.log('❌ 管理员用户创建失败');
    }

    // 登出以便创建下一个用户
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  });

  test('创建普通用户', async ({ page }) => {
    const userData = TEST_USERS.user;
    console.log('创建普通用户:', userData.email);

    // 导航到注册页面
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // 填写注册信息
    await page.fill('[data-testid="name-input"]', userData.name);
    await page.fill('[data-testid="email-input"]', userData.email);
    await page.fill('[data-testid="password-input"]', userData.password);
    await page.fill('[data-testid="confirm-password-input"]', userData.password);

    // 点击注册按钮
    await page.click('[data-testid="signup-button"]');

    // 等待重定向
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('普通用户注册后URL:', currentUrl);

    if (currentUrl.includes('/dashboard') || currentUrl.includes('/settings')) {
      console.log('✅ 普通用户创建成功');
    } else {
      console.log('❌ 普通用户创建失败');
    }
  });

  test('创建新用户', async ({ page }) => {
    const userData = TEST_USERS.newUser;
    console.log('创建新用户:', userData.email);

    // 导航到注册页面
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // 填写注册信息
    await page.fill('[data-testid="name-input"]', userData.name);
    await page.fill('[data-testid="email-input"]', userData.email);
    await page.fill('[data-testid="password-input"]', userData.password);
    await page.fill('[data-testid="confirm-password-input"]', userData.password);

    // 点击注册按钮
    await page.click('[data-testid="signup-button"]');

    // 等待重定向
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('新用户注册后URL:', currentUrl);

    if (currentUrl.includes('/dashboard') || currentUrl.includes('/settings')) {
      console.log('✅ 新用户创建成功');
    } else {
      console.log('❌ 新用户创建失败');
    }
  });
}); 