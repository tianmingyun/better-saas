import { test, expect } from '../fixtures/test-setup';
import { TEST_USERS, TEST_DATA } from '../utils/test-helpers';

test.describe('login test', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('email password login', () => {
    test('should be able to login with valid credentials', async ({ 
      page, 
      authHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await page.goto('/login');
      
      await assertionHelper.assertElementVisible('[data-testid="login-form"]');
      await assertionHelper.assertElementVisible('[data-testid="email-input"]');
      await assertionHelper.assertElementVisible('[data-testid="password-input"]');
      await assertionHelper.assertElementVisible('[data-testid="login-button"]');
      
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.admin.password);
      
      await page.click('[data-testid="login-button"]');
      
      await waitHelper.waitForLoadingComplete();
      
      await assertionHelper.assertUrl(/\/(dashboard|settings)/);
      
      await assertionHelper.assertElementVisible('[data-testid="user-menu-trigger"]');
      
      await page.click('[data-testid="user-menu-trigger"]');
      await assertionHelper.assertTextContent('[data-testid="user-email"]', TEST_USERS.admin.email);
    });

    test('should reject invalid email format', async ({ 
      page, 
      formHelper, 
      assertionHelper 
    }) => {
      await page.goto('/login');
      
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', 'password');
      
      await page.click('[data-testid="login-button"]');
      
      await assertionHelper.assertElementVisible('[data-testid="email-error"]');
      await assertionHelper.assertTextContent('[data-testid="email-error"]', '请输入有效的邮箱地址');
    });

    test('should reject invalid password', async ({ 
      page, 
      formHelper, 
      assertionHelper 
    }) => {
      await page.goto('/login');
      
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      
      await page.click('[data-testid="login-button"]');
      
      await formHelper.waitForErrorMessage('邮箱或密码错误');
    });

    test('should reject empty form fields', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/login');
      
      await page.click('[data-testid="login-button"]');
      
      await assertionHelper.assertElementVisible('[data-testid="email-error"]');
      await assertionHelper.assertElementVisible('[data-testid="password-error"]');
    });

    test('should show and hide password', async ({ page, assertionHelper }) => {
      await page.goto('/login');
      
      await page.fill('[data-testid="password-input"]', 'testpassword');
      
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('type', 'password');
      
      await page.click('[data-testid="toggle-password"]');
      
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('type', 'text');
      
      await page.click('[data-testid="toggle-password"]');
      
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('type', 'password');
    });
  });

  test.describe('OAuth login', () => {
    test('should show GitHub login button', async ({ page, assertionHelper }) => {
      await page.goto('/login');
      
      await assertionHelper.assertElementVisible('[data-testid="github-login-button"]');
      await assertionHelper.assertTextContent('[data-testid="github-login-button"]', 'GitHub');
    });

    test('should show Google login button', async ({ page, assertionHelper }) => {
      await page.goto('/login');
      
      await assertionHelper.assertElementVisible('[data-testid="google-login-button"]');
      await assertionHelper.assertTextContent('[data-testid="google-login-button"]', 'Google');
    });

    test('should redirect to GitHub when clicking GitHub login button', async ({ page }) => {
      await page.goto('/login');
      
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.click('[data-testid="github-login-button"]')
      ]);
      
      await newPage.waitForLoadState();
      expect(newPage.url()).toContain('github.com');
    });

    test('should redirect to Google when clicking Google login button', async ({ page }) => {
      await page.goto('/login');
      
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.click('[data-testid="google-login-button"]')
      ]);
      
      await newPage.waitForLoadState();
      expect(newPage.url()).toContain('accounts.google.com');
    });
  });

  test.describe('login status and redirect', () => {
    test('should redirect to dashboard when logged in user visits login page', async ({ 
      page, 
      authHelper, 
      assertionHelper 
    }) => {
      await authHelper.loginAsAdmin();
      
      await page.goto('/login');
      
      await assertionHelper.assertUrl(/\/(dashboard|settings)/);
    });

    test('should redirect to original requested page after login', async ({ 
      page, 
      authHelper, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard/users');
      
      await assertionHelper.assertUrl(/\/login/);

      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.admin.password);
      await page.click('[data-testid="login-button"]');
      
      await assertionHelper.assertUrl('/dashboard/users');
    });

    test('should maintain session state after login', async ({ 
      page, 
      authHelper, 
      assertionHelper 
    }) => {
      await authHelper.loginAsAdmin();
      
      await page.reload();
      
      await assertionHelper.assertElementVisible('[data-testid="user-menu-trigger"]');
      
      await page.goto('/dashboard/users');
      await assertionHelper.assertUrl('/dashboard/users');
    });
  });

  test.describe('remember me', () => {
    test('should extend session time when remember me is checked', async ({ 
      page, 
      authHelper, 
      assertionHelper 
    }) => {
      await page.goto('/login');
      
      await page.check('[data-testid="remember-me-checkbox"]');
      
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.admin.password);
      await page.click('[data-testid="login-button"]');
      
      await assertionHelper.assertUrl(/\/(dashboard|settings)/);
      
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(cookie => cookie.name.includes('session'));
      
      expect(sessionCookie).toBeDefined();
      if (sessionCookie) {
        expect(sessionCookie.expires).toBeGreaterThan(Date.now() / 1000 + 24 * 60 * 60);
      }
    });
  });

  test.describe('error handling', () => {
    test('should display appropriate error message when network error occurs', async ({ 
      page, 
      formHelper, 
      assertionHelper 
    }) => {
      await page.route('**/api/auth/**', route => {
        route.abort('failed');
      });
      
      await page.goto('/login');
      
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.admin.password);
      await page.click('[data-testid="login-button"]');
      
      await formHelper.waitForErrorMessage('网络连接失败，请稍后重试');
    });

    test('should display appropriate error message when server error occurs', async ({ 
      page, 
      formHelper, 
      assertionHelper 
    }) => {
      await page.route('**/api/auth/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: '服务器内部错误' })
        });
      });
      
      await page.goto('/login');
      
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.admin.password);
      await page.click('[data-testid="login-button"]');
      
      await formHelper.waitForErrorMessage('服务器错误，请稍后重试');
    });

    test('should display account lock warning after multiple login failures', async ({ 
      page, 
      formHelper, 
      assertionHelper 
    }) => {
      await page.goto('/login');
      
      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
        await page.fill('[data-testid="password-input"]', 'wrongpassword');
        await page.click('[data-testid="login-button"]');
        
        await formHelper.waitForErrorMessage();
        
        await page.reload();
      }
      
      // the 6th attempt should display account lock warning
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      
      await formHelper.waitForErrorMessage('账户已被临时锁定，请稍后再试');
    });
  });

  test.describe('accessibility test', () => {
    test('login form should support keyboard navigation', async ({ page }) => {
      await page.goto('/login');
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
    });

    test('login form should have appropriate ARIA labels', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label', '邮箱地址');
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label', '密码');
      await expect(page.locator('[data-testid="login-button"]')).toHaveAttribute('aria-label', '登录');
    });

    test('error message should be associated with form fields', async ({ page }) => {
      await page.goto('/login');
      
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-describedby', 'email-error');
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-describedby', 'password-error');
    });
  });

  test.describe('internationalization test', () => {
    test('should support Chinese interface', async ({ page, assertionHelper }) => {
      await page.goto('/zh/login');
      
      await assertionHelper.assertTextContent('[data-testid="login-title"]', '登录');
      await assertionHelper.assertTextContent('[data-testid="email-label"]', '邮箱');
      await assertionHelper.assertTextContent('[data-testid="password-label"]', '密码');
      await assertionHelper.assertTextContent('[data-testid="login-button"]', '登录');
    });

    test('should support English interface', async ({ page, assertionHelper }) => {
      await page.goto('/en/login');
      
      await assertionHelper.assertTextContent('[data-testid="login-title"]', 'Login');
      await assertionHelper.assertTextContent('[data-testid="email-label"]', 'Email');
      await assertionHelper.assertTextContent('[data-testid="password-label"]', 'Password');
      await assertionHelper.assertTextContent('[data-testid="login-button"]', 'Login');
    });

    test('language switch should stay on login page', async ({ page, assertionHelper }) => {
      await page.goto('/zh/login');
      
      await page.click('[data-testid="language-switcher"]');
      await page.click('[data-testid="language-en"]');
      
      await assertionHelper.assertUrl('/en/login');
      await assertionHelper.assertTextContent('[data-testid="login-title"]', 'Login');
    });
  });
}); 