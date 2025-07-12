import { test, expect } from '@playwright/test';

test.describe('注册调试', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到注册页面
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
  });

  test('详细调试注册过程', async ({ page }) => {
    console.log('开始注册调试测试');

    // 检查页面是否正确加载
    await expect(page.locator('[data-testid="signup-form"]')).toBeVisible();
    console.log('✓ 注册表单已加载');

    // 填写表单
    const testUser = {
      name: 'Debug User',
      email: 'debug@test.com',
      password: 'password123',
      confirmPassword: 'password123'
    };

    await page.fill('[data-testid="name-input"]', testUser.name);
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="confirm-password-input"]', testUser.confirmPassword);

    console.log('✓ 表单字段已填写');

    // 检查提交按钮状态
    const submitButton = page.locator('[data-testid="signup-button"]');
    await expect(submitButton).toBeEnabled();
    console.log('✓ 提交按钮已启用');

    // 监听网络请求
    const requests: any[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/auth')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
        console.log(`🌐 API请求: ${request.method()} ${request.url()}`);
      }
    });

    // 监听网络响应
    page.on('response', async (response) => {
      if (response.url().includes('/api/auth')) {
        const status = response.status();
        console.log(`📡 API响应: ${status} ${response.url()}`);
        
        try {
          const responseBody = await response.text();
          console.log(`📄 响应内容: ${responseBody}`);
        } catch (error) {
          console.log(`❌ 无法读取响应内容: ${error}`);
        }
      }
    });

    // 监听控制台消息
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`🚨 控制台错误: ${msg.text()}`);
      } else if (msg.type() === 'log') {
        console.log(`📝 控制台日志: ${msg.text()}`);
      }
    });

    // 注入一些调试代码来监控状态
    await page.addInitScript(() => {
      // 监控localStorage变化
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        console.log(`📦 localStorage设置: ${key} = ${value}`);
        return originalSetItem.call(this, key, value);
      };

      // 监控fetch请求
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        console.log(`🔄 Fetch请求:`, args[0]);
        return originalFetch.apply(this, args).then(response => {
          console.log(`✅ Fetch响应:`, response.status, response.url);
          return response;
        });
      };
    });

    // 提交表单
    await submitButton.click();
    console.log('✓ 已点击提交按钮');

    // 等待一段时间观察页面变化
    await page.waitForTimeout(5000);

    // 检查是否有错误消息
    const errorMessage = page.locator('.text-red-600');
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.log(`❌ 发现错误消息: ${errorText}`);
    } else {
      console.log('✓ 没有发现错误消息');
    }

    // 检查当前URL
    const currentUrl = page.url();
    console.log(`📍 当前URL: ${currentUrl}`);

    // 检查localStorage中的认证状态
    const authState = await page.evaluate(() => {
      const authStore = localStorage.getItem('auth-store');
      return authStore ? JSON.parse(authStore) : null;
    });
    console.log('🗄️ Auth Store状态:', JSON.stringify(authState, null, 2));

    // 检查是否仍在注册页面
    if (currentUrl.includes('/signup')) {
      console.log('❌ 仍在注册页面，注册可能失败');
      
      // 检查按钮状态
      const buttonText = await submitButton.textContent();
      console.log(`🔘 按钮文本: ${buttonText}`);
      
      const isButtonDisabled = await submitButton.isDisabled();
      console.log(`🔘 按钮是否禁用: ${isButtonDisabled}`);

    } else {
      console.log('✅ 已跳转到其他页面，注册可能成功');
    }

    // 输出网络请求摘要
    console.log(`📊 总共发送了 ${requests.length} 个认证相关请求`);
    requests.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`      数据: ${req.postData}`);
      }
    });

    
  });
}); 