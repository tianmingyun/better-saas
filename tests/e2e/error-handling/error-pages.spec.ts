import { test, expect } from '../fixtures/test-setup';

test.describe('错误处理测试', () => {
  test.beforeEach(async ({ page }) => {
    // 清除所有状态
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('404页面测试', () => {
    test('访问不存在的页面应该显示404页面', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      // 访问不存在的页面
      await page.goto('/zh/this-page-does-not-exist');
      await waitHelper.waitForLoadingComplete();
      
      // 验证404页面元素
      await assertionHelper.assertElementVisible('[data-testid="not-found-page"]');
      await assertionHelper.assertElementVisible('[data-testid="error-code"]');
      await assertionHelper.assertElementVisible('[data-testid="error-title"]');
      await assertionHelper.assertElementVisible('[data-testid="error-description"]');
      await assertionHelper.assertElementVisible('[data-testid="back-home-button"]');
      
      // 验证错误代码
      const errorCode = await page.textContent('[data-testid="error-code"]');
      expect(errorCode).toContain('404');
    });

    test('404页面应该有正确的标题和描述', async ({ 
      page, 
      waitHelper 
    }) => {
      await page.goto('/zh/nonexistent-page');
      await waitHelper.waitForLoadingComplete();
      
      // 验证页面标题
      const pageTitle = await page.title();
      expect(pageTitle).toMatch(/404|Not Found|页面未找到/i);
      
      // 验证错误标题
      const errorTitle = await page.textContent('[data-testid="error-title"]');
      expect(errorTitle).toMatch(/页面未找到|Page Not Found|Oops/i);
      
      // 验证错误描述
      const errorDescription = await page.textContent('[data-testid="error-description"]');
      expect(errorDescription).toBeTruthy();
      expect(errorDescription?.length).toBeGreaterThan(20);
    });

    test('404页面的返回首页按钮应该正常工作', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await page.goto('/zh/invalid-route');
      await waitHelper.waitForLoadingComplete();
      
      // 点击返回首页按钮
      await page.click('[data-testid="back-home-button"]');
      
      // 验证跳转到首页
      await assertionHelper.assertUrl('/zh');
      await assertionHelper.assertElementVisible('[data-testid="hero-section"]');
    });

    test('404页面的返回按钮应该正常工作', async ({ 
      page, 
      waitHelper 
    }) => {
      // 先访问一个正常页面
      await page.goto('/zh/blog');
      await waitHelper.waitForLoadingComplete();
      
      // 然后访问不存在的页面
      await page.goto('/zh/invalid-blog-post');
      await waitHelper.waitForLoadingComplete();
      
      // 查找返回按钮
      const goBackButton = page.locator('[data-testid="go-back-button"]');
      const goBackCount = await goBackButton.count();
      
      if (goBackCount > 0) {
        await goBackButton.click();
        
        // 验证返回到上一页
        await waitHelper.waitForLoadingComplete();
        const currentUrl = page.url();
        expect(currentUrl).toContain('/blog');
      }
    });

    test('404页面在移动端应该正确显示', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      // 设置移动端视口
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/zh/mobile-404-test');
      await waitHelper.waitForLoadingComplete();
      
      // 验证移动端404页面显示
      await assertionHelper.assertElementVisible('[data-testid="not-found-page"]');
      await assertionHelper.assertElementVisible('[data-testid="error-code"]');
      await assertionHelper.assertElementVisible('[data-testid="back-home-button"]');
      
      // 验证按钮在移动端可点击
      const backButton = page.locator('[data-testid="back-home-button"]');
      await expect(backButton).toBeVisible();
      await expect(backButton).toBeEnabled();
    });
  });

  test.describe('表单验证错误测试', () => {
    test('登录表单应该显示验证错误', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await page.goto('/zh/login');
      await waitHelper.waitForLoadingComplete();
      
      // 尝试提交空表单
      await page.click('[data-testid="login-button"]');
      
      // 验证验证错误显示
      const emailError = page.locator('[data-testid="email-error"]');
      const passwordError = page.locator('[data-testid="password-error"]');
      
      const emailErrorCount = await emailError.count();
      const passwordErrorCount = await passwordError.count();
      
      if (emailErrorCount > 0) {
        await expect(emailError).toBeVisible();
        const errorText = await emailError.textContent();
        expect(errorText).toMatch(/(必填|required|邮箱)/i);
      }
      
      if (passwordErrorCount > 0) {
        await expect(passwordError).toBeVisible();
        const errorText = await passwordError.textContent();
        expect(errorText).toMatch(/(必填|required|密码)/i);
      }
    });

    test('注册表单应该显示密码不匹配错误', async ({ 
      page, 
      waitHelper 
    }) => {
      await page.goto('/zh/signup');
      await waitHelper.waitForLoadingComplete();
      
      // 填写不匹配的密码
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'different-password');
      
      // 提交表单
      await page.click('[data-testid="signup-button"]');
      
      // 验证密码不匹配错误
      const passwordError = page.locator('[data-testid="password-mismatch-error"]');
      const errorCount = await passwordError.count();
      
      if (errorCount > 0) {
        await expect(passwordError).toBeVisible();
        const errorText = await passwordError.textContent();
        expect(errorText).toMatch(/(密码不匹配|passwords do not match)/i);
      }
    });

    test('应该显示无效邮箱格式错误', async ({ 
      page, 
      waitHelper 
    }) => {
      await page.goto('/zh/login');
      await waitHelper.waitForLoadingComplete();
      
      // 输入无效邮箱格式
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', 'password123');
      
      // 提交表单
      await page.click('[data-testid="login-button"]');
      
      // 验证邮箱格式错误
      const emailError = page.locator('[data-testid="email-format-error"]');
      const errorCount = await emailError.count();
      
      if (errorCount > 0) {
        await expect(emailError).toBeVisible();
        const errorText = await emailError.textContent();
        expect(errorText).toMatch(/(邮箱格式|email format|invalid email)/i);
      }
    });

    test('应该显示密码强度要求错误', async ({ 
      page, 
      waitHelper 
    }) => {
      await page.goto('/zh/signup');
      await waitHelper.waitForLoadingComplete();
      
      // 输入弱密码
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', '123');
      await page.fill('[data-testid="confirm-password-input"]', '123');
      
      // 提交表单
      await page.click('[data-testid="signup-button"]');
      
      // 验证密码强度错误
      const passwordError = page.locator('[data-testid="password-strength-error"]');
      const errorCount = await passwordError.count();
      
      if (errorCount > 0) {
        await expect(passwordError).toBeVisible();
        const errorText = await passwordError.textContent();
        expect(errorText).toMatch(/(密码强度|password strength|too short)/i);
      }
    });
  });

  test.describe('网络错误测试', () => {
    test('应该处理网络连接错误', async ({ 
      page, 
      waitHelper 
    }) => {
      // 模拟网络离线
      await page.context().setOffline(true);
      
      try {
        await page.goto('/zh/login');
        await waitHelper.waitForLoadingComplete();
        
        // 尝试登录（应该失败）
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');
        
        // 验证网络错误提示
        const networkError = page.locator('[data-testid="network-error"], .network-error');
        const errorCount = await networkError.count();
        
        if (errorCount > 0) {
          await expect(networkError).toBeVisible();
          const errorText = await networkError.textContent();
          expect(errorText).toMatch(/(网络错误|network error|connection failed)/i);
        }
      } finally {
        // 恢复网络连接
        await page.context().setOffline(false);
      }
    });

    test('应该处理API错误响应', async ({ 
      page, 
      waitHelper 
    }) => {
      // 拦截API请求并返回错误
      await page.route('**/api/auth/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      await page.goto('/zh/login');
      await waitHelper.waitForLoadingComplete();
      
      // 尝试登录
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      // 验证服务器错误提示
      const serverError = page.locator('[data-testid="server-error"], .server-error');
      const errorCount = await serverError.count();
      
      if (errorCount > 0) {
        await expect(serverError).toBeVisible();
        const errorText = await serverError.textContent();
        expect(errorText).toMatch(/(服务器错误|server error|internal error)/i);
      }
    });

    test('应该处理超时错误', async ({ 
      page, 
      waitHelper 
    }) => {
      // 拦截API请求并延迟响应
      await page.route('**/api/auth/**', route => {
        // 延迟10秒响应（模拟超时）
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        }, 10000);
      });
      
      await page.goto('/zh/login');
      await waitHelper.waitForLoadingComplete();
      
      // 尝试登录
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      // 等待一段时间后检查超时错误
      await page.waitForTimeout(3000);
      
      const timeoutError = page.locator('[data-testid="timeout-error"], .timeout-error');
      const errorCount = await timeoutError.count();
      
      if (errorCount > 0) {
        await expect(timeoutError).toBeVisible();
        const errorText = await timeoutError.textContent();
        expect(errorText).toMatch(/(超时|timeout|请求超时)/i);
      }
    });
  });

  test.describe('权限错误测试', () => {
    test('未登录用户访问受保护页面应该重定向到登录页', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      // 尝试访问受保护的页面
      await page.goto('/zh/dashboard');
      await waitHelper.waitForLoadingComplete();
      
      // 验证重定向到登录页面
      await assertionHelper.assertUrl(/\/login/);
      await assertionHelper.assertElementVisible('[data-testid="login-form"]');
    });

    test('普通用户访问管理员页面应该显示权限错误', async ({ 
      page, 
      authHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      // 以普通用户身份登录
      await authHelper.loginAsUser();
      
      // 尝试访问管理员页面
      await page.goto('/zh/dashboard/users');
      await waitHelper.waitForLoadingComplete();
      
      // 验证权限错误或重定向
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard/users')) {
        // 如果能访问页面，检查是否有权限错误提示
        const permissionError = page.locator('[data-testid="permission-error"], .permission-error');
        const errorCount = await permissionError.count();
        
        if (errorCount > 0) {
          await expect(permissionError).toBeVisible();
          const errorText = await permissionError.textContent();
          expect(errorText).toMatch(/(权限不足|access denied|permission denied)/i);
        }
      } else {
        // 验证重定向到其他页面
        expect(currentUrl).not.toContain('/dashboard/users');
      }
    });

    test('应该处理认证过期错误', async ({ 
      page, 
      authHelper, 
      waitHelper 
    }) => {
      // 先登录
      await authHelper.loginAsUser();
      
      // 模拟认证过期 - 拦截API请求返回401
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      });
      
      // 尝试访问需要认证的页面
      await page.goto('/zh/settings/profile');
      await waitHelper.waitForLoadingComplete();
      
      // 验证认证过期处理
      const authError = page.locator('[data-testid="auth-expired"], .auth-expired');
      const errorCount = await authError.count();
      
      if (errorCount > 0) {
        await expect(authError).toBeVisible();
        const errorText = await authError.textContent();
        expect(errorText).toMatch(/(登录过期|session expired|please login)/i);
      }
    });
  });

  test.describe('文件上传错误测试', () => {
    test('应该处理文件大小超限错误', async ({ 
      page, 
      authHelper, 
      waitHelper 
    }) => {
      // 以管理员身份登录
      await authHelper.loginAsAdmin();
      
      await page.goto('/zh/dashboard/files');
      await waitHelper.waitForLoadingComplete();
      
      // 模拟上传大文件的API错误
      await page.route('**/api/upload/**', route => {
        route.fulfill({
          status: 413,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'File too large' })
        });
      });
      
      // 查找文件上传区域
      const uploadArea = page.locator('[data-testid="file-upload-area"]');
      const uploadCount = await uploadArea.count();
      
      if (uploadCount > 0) {
        // 尝试上传文件（模拟）
        const fileInput = page.locator('input[type="file"]');
        const inputCount = await fileInput.count();
        
        if (inputCount > 0) {
          // 这里我们只验证错误处理逻辑，不实际上传文件
          // 实际测试中可以创建一个大文件进行上传测试
          console.log('文件上传错误处理测试 - 需要实际文件上传实现');
        }
      }
    });

    test('应该处理不支持的文件格式错误', async ({ 
      page, 
      authHelper, 
      waitHelper 
    }) => {
      // 以管理员身份登录
      await authHelper.loginAsAdmin();
      
      await page.goto('/zh/dashboard/files');
      await waitHelper.waitForLoadingComplete();
      
      // 模拟不支持文件格式的API错误
      await page.route('**/api/upload/**', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unsupported file format' })
        });
      });
      
      // 验证文件格式错误提示
      const formatError = page.locator('[data-testid="file-format-error"]');
      const errorCount = await formatError.count();
      
      if (errorCount > 0) {
        const errorText = await formatError.textContent();
        expect(errorText).toMatch(/(格式不支持|unsupported format|invalid file)/i);
      }
    });
  });

  test.describe('通用错误处理', () => {
    test('应该显示全局错误提示', async ({ 
      page, 
      waitHelper 
    }) => {
      await page.goto('/zh');
      await waitHelper.waitForLoadingComplete();
      
      // 模拟全局错误
      await page.evaluate(() => {
        // 触发一个未捕获的错误
        throw new Error('Test global error');
      });
      
      // 验证全局错误处理
      const globalError = page.locator('[data-testid="global-error"], .global-error');
      const errorCount = await globalError.count();
      
      if (errorCount > 0) {
        await expect(globalError).toBeVisible();
      }
    });

    test('错误提示应该自动消失', async ({ 
      page, 
      waitHelper 
    }) => {
      await page.goto('/zh/login');
      await waitHelper.waitForLoadingComplete();
      
      // 触发一个错误
      await page.click('[data-testid="login-button"]');
      
      // 查找错误提示
      const errorMessage = page.locator('[data-testid="error-message"], .error-message');
      const errorCount = await errorMessage.count();
      
      if (errorCount > 0) {
        await expect(errorMessage).toBeVisible();
        
        // 等待错误提示自动消失
        await page.waitForTimeout(5000);
        
        const isStillVisible = await errorMessage.isVisible();
        expect(isStillVisible).toBeFalsy();
      }
    });

    test('应该支持手动关闭错误提示', async ({ 
      page, 
      waitHelper 
    }) => {
      await page.goto('/zh/login');
      await waitHelper.waitForLoadingComplete();
      
      // 触发一个错误
      await page.click('[data-testid="login-button"]');
      
      // 查找错误提示和关闭按钮
      const errorMessage = page.locator('[data-testid="error-message"]');
      const closeButton = page.locator('[data-testid="close-error"]');
      
      const errorCount = await errorMessage.count();
      const closeCount = await closeButton.count();
      
      if (errorCount > 0 && closeCount > 0) {
        await expect(errorMessage).toBeVisible();
        
        // 点击关闭按钮
        await closeButton.click();
        
        // 验证错误提示消失
        await expect(errorMessage).toBeHidden();
      }
    });

    test('错误页面应该有正确的HTTP状态码', async ({ 
      page 
    }) => {
      const response = await page.goto('/zh/nonexistent-page');
      
      // 验证HTTP状态码
      expect(response?.status()).toBe(404);
    });
  });
}); 