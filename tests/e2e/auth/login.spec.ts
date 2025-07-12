import { test, expect } from '../fixtures/test-setup';
import { TEST_USERS, TEST_DATA } from '../utils/test-helpers';

test.describe('登录功能测试', () => {
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

  test.describe('邮箱密码登录', () => {
    test('应该能够使用有效凭据登录', async ({ 
      page, 
      authHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await page.goto('/login');
      
      // 验证登录页面元素
      await assertionHelper.assertElementVisible('[data-testid="login-form"]');
      await assertionHelper.assertElementVisible('[data-testid="email-input"]');
      await assertionHelper.assertElementVisible('[data-testid="password-input"]');
      await assertionHelper.assertElementVisible('[data-testid="login-button"]');
      
      // 输入登录信息
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.admin.password);
      
      // 点击登录按钮
      await page.click('[data-testid="login-button"]');
      
      // 等待加载完成
      await waitHelper.waitForLoadingComplete();
      
      // 验证登录成功 - 应该重定向到仪表板
      await assertionHelper.assertUrl(/\/(dashboard|settings)/);
      
      // 验证用户菜单可见
      await assertionHelper.assertElementVisible('[data-testid="user-menu-trigger"]');
      
      // 验证用户信息
      await page.click('[data-testid="user-menu-trigger"]');
      await assertionHelper.assertTextContent('[data-testid="user-email"]', TEST_USERS.admin.email);
    });

    test('应该拒绝无效的邮箱格式', async ({ 
      page, 
      formHelper, 
      assertionHelper 
    }) => {
      await page.goto('/login');
      
      // 输入无效邮箱
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', 'password');
      
      // 点击登录按钮
      await page.click('[data-testid="login-button"]');
      
      // 验证错误消息
      await assertionHelper.assertElementVisible('[data-testid="email-error"]');
      await assertionHelper.assertTextContent('[data-testid="email-error"]', '请输入有效的邮箱地址');
    });

    test('应该拒绝错误的密码', async ({ 
      page, 
      formHelper, 
      assertionHelper 
    }) => {
      await page.goto('/login');
      
      // 输入正确邮箱但错误密码
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      
      // 点击登录按钮
      await page.click('[data-testid="login-button"]');
      
      // 验证错误消息
      await formHelper.waitForErrorMessage('邮箱或密码错误');
    });

    test('应该拒绝空的表单字段', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/login');
      
      // 不填写任何字段直接点击登录
      await page.click('[data-testid="login-button"]');
      
      // 验证必填字段错误
      await assertionHelper.assertElementVisible('[data-testid="email-error"]');
      await assertionHelper.assertElementVisible('[data-testid="password-error"]');
    });

    test('应该显示和隐藏密码', async ({ page, assertionHelper }) => {
      await page.goto('/login');
      
      // 输入密码
      await page.fill('[data-testid="password-input"]', 'testpassword');
      
      // 验证密码默认隐藏
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('type', 'password');
      
      // 点击显示密码按钮
      await page.click('[data-testid="toggle-password"]');
      
      // 验证密码显示
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('type', 'text');
      
      // 再次点击隐藏密码
      await page.click('[data-testid="toggle-password"]');
      
      // 验证密码隐藏
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('type', 'password');
    });
  });

  test.describe('OAuth 登录', () => {
    test('应该显示 GitHub 登录按钮', async ({ page, assertionHelper }) => {
      await page.goto('/login');
      
      // 验证 GitHub 登录按钮存在
      await assertionHelper.assertElementVisible('[data-testid="github-login-button"]');
      await assertionHelper.assertTextContent('[data-testid="github-login-button"]', 'GitHub');
    });

    test('应该显示 Google 登录按钮', async ({ page, assertionHelper }) => {
      await page.goto('/login');
      
      // 验证 Google 登录按钮存在
      await assertionHelper.assertElementVisible('[data-testid="google-login-button"]');
      await assertionHelper.assertTextContent('[data-testid="google-login-button"]', 'Google');
    });

    test('点击 GitHub 登录应该重定向到 GitHub', async ({ page }) => {
      await page.goto('/login');
      
      // 监听新页面打开
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.click('[data-testid="github-login-button"]')
      ]);
      
      // 验证重定向到 GitHub
      await newPage.waitForLoadState();
      expect(newPage.url()).toContain('github.com');
    });

    test('点击 Google 登录应该重定向到 Google', async ({ page }) => {
      await page.goto('/login');
      
      // 监听新页面打开
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.click('[data-testid="google-login-button"]')
      ]);
      
      // 验证重定向到 Google
      await newPage.waitForLoadState();
      expect(newPage.url()).toContain('accounts.google.com');
    });
  });

  test.describe('登录状态和重定向', () => {
    test('已登录用户访问登录页面应该重定向', async ({ 
      page, 
      authHelper, 
      assertionHelper 
    }) => {
      // 先登录
      await authHelper.loginAsAdmin();
      
      // 然后访问登录页面
      await page.goto('/login');
      
      // 应该重定向到仪表板
      await assertionHelper.assertUrl(/\/(dashboard|settings)/);
    });

    test('登录后应该重定向到原始请求的页面', async ({ 
      page, 
      authHelper, 
      assertionHelper 
    }) => {
      // 尝试访问受保护的页面
      await page.goto('/dashboard/users');
      
      // 应该重定向到登录页面
      await assertionHelper.assertUrl(/\/login/);
      
      // 登录
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.admin.password);
      await page.click('[data-testid="login-button"]');
      
      // 应该重定向到原始请求的页面
      await assertionHelper.assertUrl('/dashboard/users');
    });

    test('登录后应该保持会话状态', async ({ 
      page, 
      authHelper, 
      assertionHelper 
    }) => {
      // 登录
      await authHelper.loginAsAdmin();
      
      // 刷新页面
      await page.reload();
      
      // 验证仍然处于登录状态
      await assertionHelper.assertElementVisible('[data-testid="user-menu-trigger"]');
      
      // 访问其他页面
      await page.goto('/dashboard/users');
      await assertionHelper.assertUrl('/dashboard/users');
    });
  });

  test.describe('记住我功能', () => {
    test('勾选记住我应该延长会话时间', async ({ 
      page, 
      authHelper, 
      assertionHelper 
    }) => {
      await page.goto('/login');
      
      // 勾选记住我
      await page.check('[data-testid="remember-me-checkbox"]');
      
      // 登录
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.admin.password);
      await page.click('[data-testid="login-button"]');
      
      // 验证登录成功
      await assertionHelper.assertUrl(/\/(dashboard|settings)/);
      
      // 检查 cookie 设置 (记住我应该设置更长的过期时间)
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(cookie => cookie.name.includes('session'));
      
      expect(sessionCookie).toBeDefined();
      // 验证 cookie 有较长的过期时间 (记住我功能)
      if (sessionCookie) {
        expect(sessionCookie.expires).toBeGreaterThan(Date.now() / 1000 + 24 * 60 * 60); // 至少24小时
      }
    });
  });

  test.describe('错误处理', () => {
    test('网络错误时应该显示适当的错误消息', async ({ 
      page, 
      formHelper, 
      assertionHelper 
    }) => {
      // 模拟网络错误
      await page.route('**/api/auth/**', route => {
        route.abort('failed');
      });
      
      await page.goto('/login');
      
      // 尝试登录
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.admin.password);
      await page.click('[data-testid="login-button"]');
      
      // 验证错误消息
      await formHelper.waitForErrorMessage('网络连接失败，请稍后重试');
    });

    test('服务器错误时应该显示适当的错误消息', async ({ 
      page, 
      formHelper, 
      assertionHelper 
    }) => {
      // 模拟服务器错误
      await page.route('**/api/auth/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: '服务器内部错误' })
        });
      });
      
      await page.goto('/login');
      
      // 尝试登录
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.admin.password);
      await page.click('[data-testid="login-button"]');
      
      // 验证错误消息
      await formHelper.waitForErrorMessage('服务器错误，请稍后重试');
    });

    test('多次登录失败应该显示账户锁定警告', async ({ 
      page, 
      formHelper, 
      assertionHelper 
    }) => {
      await page.goto('/login');
      
      // 模拟多次登录失败
      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
        await page.fill('[data-testid="password-input"]', 'wrongpassword');
        await page.click('[data-testid="login-button"]');
        
        // 等待错误消息
        await formHelper.waitForErrorMessage();
        
        // 清除错误消息
        await page.reload();
      }
      
      // 第6次尝试应该显示账户锁定警告
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      
      // 验证锁定警告
      await formHelper.waitForErrorMessage('账户已被临时锁定，请稍后再试');
    });
  });

  test.describe('可访问性测试', () => {
    test('登录表单应该支持键盘导航', async ({ page }) => {
      await page.goto('/login');
      
      // 使用 Tab 键导航
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
    });

    test('登录表单应该有适当的 ARIA 标签', async ({ page }) => {
      await page.goto('/login');
      
      // 验证 ARIA 标签
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label', '邮箱地址');
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label', '密码');
      await expect(page.locator('[data-testid="login-button"]')).toHaveAttribute('aria-label', '登录');
    });

    test('错误消息应该与表单字段关联', async ({ page }) => {
      await page.goto('/login');
      
      // 触发验证错误
      await page.click('[data-testid="login-button"]');
      
      // 验证 aria-describedby 关联
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-describedby', 'email-error');
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-describedby', 'password-error');
    });
  });

  test.describe('国际化测试', () => {
    test('应该支持中文界面', async ({ page, assertionHelper }) => {
      await page.goto('/zh/login');
      
      // 验证中文文本
      await assertionHelper.assertTextContent('[data-testid="login-title"]', '登录');
      await assertionHelper.assertTextContent('[data-testid="email-label"]', '邮箱');
      await assertionHelper.assertTextContent('[data-testid="password-label"]', '密码');
      await assertionHelper.assertTextContent('[data-testid="login-button"]', '登录');
    });

    test('应该支持英文界面', async ({ page, assertionHelper }) => {
      await page.goto('/en/login');
      
      // 验证英文文本
      await assertionHelper.assertTextContent('[data-testid="login-title"]', 'Login');
      await assertionHelper.assertTextContent('[data-testid="email-label"]', 'Email');
      await assertionHelper.assertTextContent('[data-testid="password-label"]', 'Password');
      await assertionHelper.assertTextContent('[data-testid="login-button"]', 'Login');
    });

    test('语言切换应该保持在登录页面', async ({ page, assertionHelper }) => {
      await page.goto('/zh/login');
      
      // 切换到英文
      await page.click('[data-testid="language-switcher"]');
      await page.click('[data-testid="language-en"]');
      
      // 验证 URL 和内容
      await assertionHelper.assertUrl('/en/login');
      await assertionHelper.assertTextContent('[data-testid="login-title"]', 'Login');
    });
  });
}); 