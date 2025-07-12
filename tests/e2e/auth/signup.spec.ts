import { test, expect } from '../fixtures/test-setup';
import { TEST_USERS, TEST_DATA } from '../utils/test-helpers';

test.describe('注册功能测试', () => {
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

  test.describe('邮箱注册', () => {
    test('应该能够成功注册新用户', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await page.goto('/signup');
      
      // 验证注册页面元素
      await assertionHelper.assertElementVisible('[data-testid="signup-form"]');
      await assertionHelper.assertElementVisible('[data-testid="name-input"]');
      await assertionHelper.assertElementVisible('[data-testid="email-input"]');
      await assertionHelper.assertElementVisible('[data-testid="password-input"]');
      await assertionHelper.assertElementVisible('[data-testid="confirm-password-input"]');
      await assertionHelper.assertElementVisible('[data-testid="signup-button"]');
      
      // 填写注册表单
      const newUser = {
        name: TEST_USERS.newUser.name,
        email: `test-${Date.now()}@example.com`, // 使用时间戳确保唯一性
        password: TEST_USERS.newUser.password,
      };
      
      await page.fill('[data-testid="name-input"]', newUser.name);
      await page.fill('[data-testid="email-input"]', newUser.email);
      await page.fill('[data-testid="password-input"]', newUser.password);
      await page.fill('[data-testid="confirm-password-input"]', newUser.password);
      
      // 点击注册按钮
      await page.click('[data-testid="signup-button"]');
      
      // 等待加载完成
      await waitHelper.waitForLoadingComplete();
      
      // 验证注册成功 - 应该重定向到设置页面
      await assertionHelper.assertUrl(/\/(dashboard|settings)/);
      
      // 验证用户菜单可见
      await assertionHelper.assertElementVisible('[data-testid="user-menu-trigger"]');
      
      // 验证用户信息
      await page.click('[data-testid="user-menu-trigger"]');
      await assertionHelper.assertTextContent('[data-testid="user-email"]', newUser.email);
      await assertionHelper.assertTextContent('[data-testid="user-name"]', newUser.name);
    });

    test('应该拒绝无效的邮箱格式', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      // 输入无效邮箱
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      
      // 点击注册按钮
      await page.click('[data-testid="signup-button"]');
      
      // 验证错误消息
      await assertionHelper.assertElementVisible('[data-testid="email-error"]');
      await assertionHelper.assertTextContent('[data-testid="email-error"]', '请输入有效的邮箱地址');
    });

    test('应该拒绝已存在的邮箱', async ({ 
      page, 
      formHelper, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      // 使用已存在的邮箱
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      
      // 点击注册按钮
      await page.click('[data-testid="signup-button"]');
      
      // 验证错误消息
      await formHelper.waitForErrorMessage('该邮箱已被注册');
    });

    test('应该拒绝弱密码', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      // 输入弱密码
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', '123'); // 弱密码
      await page.fill('[data-testid="confirm-password-input"]', '123');
      
      // 点击注册按钮
      await page.click('[data-testid="signup-button"]');
      
      // 验证错误消息
      await assertionHelper.assertElementVisible('[data-testid="password-error"]');
      await assertionHelper.assertTextContent('[data-testid="password-error"]', '密码至少需要8个字符');
    });

    test('应该验证密码确认匹配', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      // 输入不匹配的密码
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password456');
      
      // 点击注册按钮
      await page.click('[data-testid="signup-button"]');
      
      // 验证错误消息
      await assertionHelper.assertElementVisible('[data-testid="confirm-password-error"]');
      await assertionHelper.assertTextContent('[data-testid="confirm-password-error"]', '密码确认不匹配');
    });

    test('应该要求填写所有必填字段', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      // 不填写任何字段直接点击注册
      await page.click('[data-testid="signup-button"]');
      
      // 验证所有必填字段错误
      await assertionHelper.assertElementVisible('[data-testid="name-error"]');
      await assertionHelper.assertElementVisible('[data-testid="email-error"]');
      await assertionHelper.assertElementVisible('[data-testid="password-error"]');
      await assertionHelper.assertElementVisible('[data-testid="confirm-password-error"]');
    });

    test('应该显示密码强度指示器', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      // 输入弱密码
      await page.fill('[data-testid="password-input"]', '123');
      await assertionHelper.assertElementVisible('[data-testid="password-strength"]');
      await assertionHelper.assertTextContent('[data-testid="password-strength"]', '弱');
      
      // 输入中等密码
      await page.fill('[data-testid="password-input"]', 'password');
      await assertionHelper.assertTextContent('[data-testid="password-strength"]', '中');
      
      // 输入强密码
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await assertionHelper.assertTextContent('[data-testid="password-strength"]', '强');
    });
  });

  test.describe('OAuth 注册', () => {
    test('应该显示 GitHub 注册按钮', async ({ page, assertionHelper }) => {
      await page.goto('/signup');
      
      // 验证 GitHub 注册按钮存在
      await assertionHelper.assertElementVisible('[data-testid="github-signup-button"]');
      await assertionHelper.assertTextContent('[data-testid="github-signup-button"]', 'GitHub');
    });

    test('应该显示 Google 注册按钮', async ({ page, assertionHelper }) => {
      await page.goto('/signup');
      
      // 验证 Google 注册按钮存在
      await assertionHelper.assertElementVisible('[data-testid="google-signup-button"]');
      await assertionHelper.assertTextContent('[data-testid="google-signup-button"]', 'Google');
    });

    test('点击 GitHub 注册应该重定向到 GitHub', async ({ page }) => {
      await page.goto('/signup');
      
      // 监听新页面打开
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.click('[data-testid="github-signup-button"]')
      ]);
      
      // 验证重定向到 GitHub
      await newPage.waitForLoadState();
      expect(newPage.url()).toContain('github.com');
    });

    test('点击 Google 注册应该重定向到 Google', async ({ page }) => {
      await page.goto('/signup');
      
      // 监听新页面打开
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.click('[data-testid="google-signup-button"]')
      ]);
      
      // 验证重定向到 Google
      await newPage.waitForLoadState();
      expect(newPage.url()).toContain('accounts.google.com');
    });
  });

  test.describe('用户协议和隐私政策', () => {
    test('应该显示用户协议链接', async ({ page, assertionHelper }) => {
      await page.goto('/signup');
      
      // 验证用户协议链接
      await assertionHelper.assertElementVisible('[data-testid="terms-link"]');
      await assertionHelper.assertTextContent('[data-testid="terms-link"]', '用户协议');
    });

    test('应该显示隐私政策链接', async ({ page, assertionHelper }) => {
      await page.goto('/signup');
      
      // 验证隐私政策链接
      await assertionHelper.assertElementVisible('[data-testid="privacy-link"]');
      await assertionHelper.assertTextContent('[data-testid="privacy-link"]', '隐私政策');
    });

    test('应该要求同意用户协议', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      // 填写表单但不勾选协议
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      
      // 点击注册按钮
      await page.click('[data-testid="signup-button"]');
      
      // 验证协议错误消息
      await assertionHelper.assertElementVisible('[data-testid="terms-error"]');
      await assertionHelper.assertTextContent('[data-testid="terms-error"]', '请同意用户协议');
    });

    test('勾选协议后应该能够注册', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await page.goto('/signup');
      
      // 填写表单
      const newUser = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
      };
      
      await page.fill('[data-testid="name-input"]', newUser.name);
      await page.fill('[data-testid="email-input"]', newUser.email);
      await page.fill('[data-testid="password-input"]', newUser.password);
      await page.fill('[data-testid="confirm-password-input"]', newUser.password);
      
      // 勾选协议
      await page.check('[data-testid="terms-checkbox"]');
      
      // 点击注册按钮
      await page.click('[data-testid="signup-button"]');
      
      // 等待加载完成
      await waitHelper.waitForLoadingComplete();
      
      // 验证注册成功
      await assertionHelper.assertUrl(/\/(dashboard|settings)/);
    });
  });

  test.describe('邮箱验证', () => {
    test('注册后应该显示邮箱验证提示', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await page.goto('/signup');
      
      // 填写并提交注册表单
      const newUser = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
      };
      
      await page.fill('[data-testid="name-input"]', newUser.name);
      await page.fill('[data-testid="email-input"]', newUser.email);
      await page.fill('[data-testid="password-input"]', newUser.password);
      await page.fill('[data-testid="confirm-password-input"]', newUser.password);
      await page.check('[data-testid="terms-checkbox"]');
      
      await page.click('[data-testid="signup-button"]');
      
      // 等待加载完成
      await waitHelper.waitForLoadingComplete();
      
      // 验证邮箱验证提示
      await assertionHelper.assertElementVisible('[data-testid="email-verification-notice"]');
      await assertionHelper.assertTextContent(
        '[data-testid="email-verification-notice"]', 
        '请检查您的邮箱并点击验证链接'
      );
    });

    test('应该能够重新发送验证邮件', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      // 假设用户已注册但未验证
      await page.goto('/signup');
      
      // 先完成注册流程
      const newUser = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
      };
      
      await page.fill('[data-testid="name-input"]', newUser.name);
      await page.fill('[data-testid="email-input"]', newUser.email);
      await page.fill('[data-testid="password-input"]', newUser.password);
      await page.fill('[data-testid="confirm-password-input"]', newUser.password);
      await page.check('[data-testid="terms-checkbox"]');
      
      await page.click('[data-testid="signup-button"]');
      await waitHelper.waitForLoadingComplete();
      
      // 点击重新发送验证邮件
      await page.click('[data-testid="resend-verification-button"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('验证邮件已重新发送');
    });
  });

  test.describe('登录页面导航', () => {
    test('应该显示登录页面链接', async ({ page, assertionHelper }) => {
      await page.goto('/signup');
      
      // 验证登录链接
      await assertionHelper.assertElementVisible('[data-testid="login-link"]');
      await assertionHelper.assertTextContent('[data-testid="login-link"]', '已有账户？立即登录');
    });

    test('点击登录链接应该跳转到登录页面', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      // 点击登录链接
      await page.click('[data-testid="login-link"]');
      
      // 验证跳转到登录页面
      await assertionHelper.assertUrl('/login');
      await assertionHelper.assertElementVisible('[data-testid="login-form"]');
    });
  });

  test.describe('错误处理', () => {
    test('网络错误时应该显示适当的错误消息', async ({ 
      page, 
      formHelper 
    }) => {
      // 模拟网络错误
      await page.route('**/api/auth/**', route => {
        route.abort('failed');
      });
      
      await page.goto('/signup');
      
      // 填写并提交表单
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.check('[data-testid="terms-checkbox"]');
      
      await page.click('[data-testid="signup-button"]');
      
      // 验证错误消息
      await formHelper.waitForErrorMessage('网络连接失败，请稍后重试');
    });

    test('服务器错误时应该显示适当的错误消息', async ({ 
      page, 
      formHelper 
    }) => {
      // 模拟服务器错误
      await page.route('**/api/auth/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: '服务器内部错误' })
        });
      });
      
      await page.goto('/signup');
      
      // 填写并提交表单
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.check('[data-testid="terms-checkbox"]');
      
      await page.click('[data-testid="signup-button"]');
      
      // 验证错误消息
      await formHelper.waitForErrorMessage('服务器错误，请稍后重试');
    });
  });

  test.describe('可访问性测试', () => {
    test('注册表单应该支持键盘导航', async ({ page }) => {
      await page.goto('/signup');
      
      // 使用 Tab 键导航
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="name-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="confirm-password-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="terms-checkbox"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="signup-button"]')).toBeFocused();
    });

    test('注册表单应该有适当的 ARIA 标签', async ({ page }) => {
      await page.goto('/signup');
      
      // 验证 ARIA 标签
      await expect(page.locator('[data-testid="name-input"]')).toHaveAttribute('aria-label', '姓名');
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label', '邮箱地址');
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label', '密码');
      await expect(page.locator('[data-testid="confirm-password-input"]')).toHaveAttribute('aria-label', '确认密码');
      await expect(page.locator('[data-testid="signup-button"]')).toHaveAttribute('aria-label', '注册');
    });
  });

  test.describe('国际化测试', () => {
    test('应该支持中文界面', async ({ page, assertionHelper }) => {
      await page.goto('/zh/signup');
      
      // 验证中文文本
      await assertionHelper.assertTextContent('[data-testid="signup-title"]', '注册');
      await assertionHelper.assertTextContent('[data-testid="name-label"]', '姓名');
      await assertionHelper.assertTextContent('[data-testid="email-label"]', '邮箱');
      await assertionHelper.assertTextContent('[data-testid="password-label"]', '密码');
      await assertionHelper.assertTextContent('[data-testid="signup-button"]', '注册');
    });

    test('应该支持英文界面', async ({ page, assertionHelper }) => {
      await page.goto('/en/signup');
      
      // 验证英文文本
      await assertionHelper.assertTextContent('[data-testid="signup-title"]', 'Sign Up');
      await assertionHelper.assertTextContent('[data-testid="name-label"]', 'Name');
      await assertionHelper.assertTextContent('[data-testid="email-label"]', 'Email');
      await assertionHelper.assertTextContent('[data-testid="password-label"]', 'Password');
      await assertionHelper.assertTextContent('[data-testid="signup-button"]', 'Sign Up');
    });
  });
}); 