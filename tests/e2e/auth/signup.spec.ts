import { test, expect } from '../fixtures/test-setup';
import { TEST_USERS, TEST_DATA } from '../utils/test-helpers';

test.describe('signup test', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('email signup', () => {
    test('should be able to successfully register a new user', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await page.goto('/signup');
      
      await assertionHelper.assertElementVisible('[data-testid="signup-form"]');
      await assertionHelper.assertElementVisible('[data-testid="name-input"]');
      await assertionHelper.assertElementVisible('[data-testid="email-input"]');
      await assertionHelper.assertElementVisible('[data-testid="password-input"]');
      await assertionHelper.assertElementVisible('[data-testid="confirm-password-input"]');
      await assertionHelper.assertElementVisible('[data-testid="signup-button"]');
      
      const newUser = {
        name: TEST_USERS.newUser.name,
        email: `test-${Date.now()}@example.com`,
        password: TEST_USERS.newUser.password,
      };
      
      await page.fill('[data-testid="name-input"]', newUser.name);
      await page.fill('[data-testid="email-input"]', newUser.email);
      await page.fill('[data-testid="password-input"]', newUser.password);
      await page.fill('[data-testid="confirm-password-input"]', newUser.password);
      
      await page.click('[data-testid="signup-button"]');
      
      await waitHelper.waitForLoadingComplete();
      
      await assertionHelper.assertUrl(/\/(dashboard|settings)/);
      
      await assertionHelper.assertElementVisible('[data-testid="user-menu-trigger"]');
      
      await page.click('[data-testid="user-menu-trigger"]');
      await assertionHelper.assertTextContent('[data-testid="user-email"]', newUser.email);
      await assertionHelper.assertTextContent('[data-testid="user-name"]', newUser.name);
    });

    test('should reject invalid email format', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      
      await page.click('[data-testid="signup-button"]');
      
      await assertionHelper.assertElementVisible('[data-testid="email-error"]');
      await assertionHelper.assertTextContent('[data-testid="email-error"]', '请输入有效的邮箱地址');
    });

    test('should reject existing email', async ({ 
      page, 
      formHelper, 
      assertionHelper 
    }) => {
      await page.goto('/signup');

      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', TEST_USERS.admin.email);
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      
      await page.click('[data-testid="signup-button"]');
      
      await formHelper.waitForErrorMessage('该邮箱已被注册');
    });

    test('should reject weak password', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', '123'); // 弱密码
      await page.fill('[data-testid="confirm-password-input"]', '123');
      
      await page.click('[data-testid="signup-button"]');
      
      await assertionHelper.assertElementVisible('[data-testid="password-error"]');
      await assertionHelper.assertTextContent('[data-testid="password-error"]', '密码至少需要8个字符');
    });

    test('should validate password confirmation', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password456');
      
      await page.click('[data-testid="signup-button"]');
      
      await assertionHelper.assertElementVisible('[data-testid="confirm-password-error"]');
      await assertionHelper.assertTextContent('[data-testid="confirm-password-error"]', '密码确认不匹配');
    });

    test('should require all required fields', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      await page.click('[data-testid="signup-button"]');
      
      await assertionHelper.assertElementVisible('[data-testid="name-error"]');
      await assertionHelper.assertElementVisible('[data-testid="email-error"]');
      await assertionHelper.assertElementVisible('[data-testid="password-error"]');
      await assertionHelper.assertElementVisible('[data-testid="confirm-password-error"]');
    });

    test('should display password strength indicator', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      await page.fill('[data-testid="password-input"]', '123');
      await assertionHelper.assertElementVisible('[data-testid="password-strength"]');
      await assertionHelper.assertTextContent('[data-testid="password-strength"]', '弱');
      
      await page.fill('[data-testid="password-input"]', 'password');
      await assertionHelper.assertTextContent('[data-testid="password-strength"]', '中');
      
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await assertionHelper.assertTextContent('[data-testid="password-strength"]', '强');
    });
  });

  test.describe('OAuth signup', () => {
    test('should display GitHub signup button', async ({ page, assertionHelper }) => {
      await page.goto('/signup');
      
      await assertionHelper.assertElementVisible('[data-testid="github-signup-button"]');
      await assertionHelper.assertTextContent('[data-testid="github-signup-button"]', 'GitHub');
    });

    test('should display Google signup button', async ({ page, assertionHelper }) => {
      await page.goto('/signup');
      
      await assertionHelper.assertElementVisible('[data-testid="google-signup-button"]');
      await assertionHelper.assertTextContent('[data-testid="google-signup-button"]', 'Google');
    });

    test('should redirect to GitHub when clicking GitHub signup button', async ({ page }) => {
      await page.goto('/signup');
      
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.click('[data-testid="github-signup-button"]')
      ]);
      
      await newPage.waitForLoadState();
      expect(newPage.url()).toContain('github.com');
    });

    test('should redirect to Google when clicking Google signup button', async ({ page }) => {
      await page.goto('/signup');
      
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.click('[data-testid="google-signup-button"]')
      ]);
      
      await newPage.waitForLoadState();
      expect(newPage.url()).toContain('accounts.google.com');
    });
  });

  test.describe('terms and privacy policy', () => {
    test('should display terms link', async ({ page, assertionHelper }) => {
      await page.goto('/signup');

      await assertionHelper.assertElementVisible('[data-testid="terms-link"]');
      await assertionHelper.assertTextContent('[data-testid="terms-link"]', '用户协议');
    });

    test('should display privacy policy link', async ({ page, assertionHelper }) => {
      await page.goto('/signup');
      
      await assertionHelper.assertElementVisible('[data-testid="privacy-link"]');
      await assertionHelper.assertTextContent('[data-testid="privacy-link"]', '隐私政策');
    });

    test('should require accepting terms', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      
      await page.click('[data-testid="signup-button"]');
      
      await assertionHelper.assertElementVisible('[data-testid="terms-error"]');
      await assertionHelper.assertTextContent('[data-testid="terms-error"]', '请同意用户协议');
    });

    test('should be able to register after accepting terms', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await page.goto('/signup');
      
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
      
      await assertionHelper.assertUrl(/\/(dashboard|settings)/);
    });
  });

  test.describe('email verification', () => {
    test('should display email verification notice after registration', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await page.goto('/signup');
      
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
      
      await assertionHelper.assertElementVisible('[data-testid="email-verification-notice"]');
      await assertionHelper.assertTextContent(
        '[data-testid="email-verification-notice"]', 
        '请检查您的邮箱并点击验证链接'
      );
    });

    test('should be able to resend verification email', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await page.goto('/signup');
      
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
      
      await page.click('[data-testid="resend-verification-button"]');
      
      await formHelper.waitForSuccessMessage('验证邮件已重新发送');
    });
  });

  test.describe('login page navigation', () => {
    test('should display login page link', async ({ page, assertionHelper }) => {
      await page.goto('/signup');
      
      await assertionHelper.assertElementVisible('[data-testid="login-link"]');
      await assertionHelper.assertTextContent('[data-testid="login-link"]', '已有账户？立即登录');
    });

    test('should redirect to login page when clicking login link', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/signup');
      
      await page.click('[data-testid="login-link"]');
      
      await assertionHelper.assertUrl('/login');
      await assertionHelper.assertElementVisible('[data-testid="login-form"]');
    });
  });

  test.describe('error handling', () => {
    test('should display appropriate error message when network error occurs', async ({ 
      page, 
      formHelper 
    }) => {
      await page.route('**/api/auth/**', route => {
        route.abort('failed');
      });
      
      await page.goto('/signup');
      
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.check('[data-testid="terms-checkbox"]');
      
      await page.click('[data-testid="signup-button"]');
      
      await formHelper.waitForErrorMessage('网络连接失败，请稍后重试');
    });

    test('should display appropriate error message when server error occurs', async ({ 
      page, 
      formHelper 
    }) => {
      await page.route('**/api/auth/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: '服务器内部错误' })
        });
      });
      
      await page.goto('/signup');
      
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.check('[data-testid="terms-checkbox"]');
      
      await page.click('[data-testid="signup-button"]');
      
      await formHelper.waitForErrorMessage('服务器错误，请稍后重试');
    });
  });

  test.describe('accessibility test', () => {
    test('signup form should support keyboard navigation', async ({ page }) => {
      await page.goto('/signup');
      
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

    test('signup form should have appropriate ARIA labels', async ({ page }) => {
      await page.goto('/signup');
      
      await expect(page.locator('[data-testid="name-input"]')).toHaveAttribute('aria-label', '姓名');
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label', '邮箱地址');
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label', '密码');
      await expect(page.locator('[data-testid="confirm-password-input"]')).toHaveAttribute('aria-label', '确认密码');
      await expect(page.locator('[data-testid="signup-button"]')).toHaveAttribute('aria-label', '注册');
    });
  });

  test.describe('internationalization test', () => {
    test('should support Chinese interface', async ({ page, assertionHelper }) => {
      await page.goto('/zh/signup');
      
      await assertionHelper.assertTextContent('[data-testid="signup-title"]', '注册');
      await assertionHelper.assertTextContent('[data-testid="name-label"]', '姓名');
      await assertionHelper.assertTextContent('[data-testid="email-label"]', '邮箱');
      await assertionHelper.assertTextContent('[data-testid="password-label"]', '密码');
      await assertionHelper.assertTextContent('[data-testid="signup-button"]', '注册');
    });

    test('should support English interface', async ({ page, assertionHelper }) => {
      await page.goto('/en/signup');
      
      await assertionHelper.assertTextContent('[data-testid="signup-title"]', 'Sign Up');
      await assertionHelper.assertTextContent('[data-testid="name-label"]', 'Name');
      await assertionHelper.assertTextContent('[data-testid="email-label"]', 'Email');
      await assertionHelper.assertTextContent('[data-testid="password-label"]', 'Password');
      await assertionHelper.assertTextContent('[data-testid="signup-button"]', 'Sign Up');
    });
  });
}); 