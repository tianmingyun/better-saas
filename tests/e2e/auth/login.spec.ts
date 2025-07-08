import { test, expect } from '@playwright/test'

test.describe('用户登录流程', () => {
  test.beforeEach(async ({ page }) => {
    // 访问登录页面
    await page.goto('/auth/sign-in')
  })

  test('应该显示登录表单', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/登录|Sign In/)

    // 检查表单元素
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // 检查社交登录按钮
    await expect(page.locator('text=GitHub')).toBeVisible()
    await expect(page.locator('text=Google')).toBeVisible()
  })

  test('应该显示必填字段验证错误', async ({ page }) => {
    // 点击提交按钮而不填写任何字段
    await page.click('button[type="submit"]')

    // 检查验证错误消息
    await expect(page.locator('text=邮箱是必填项')).toBeVisible()
    await expect(page.locator('text=密码是必填项')).toBeVisible()
  })

  test('应该显示无效邮箱格式错误', async ({ page }) => {
    // 输入无效邮箱
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 检查邮箱格式错误
    await expect(page.locator('text=请输入有效的邮箱地址')).toBeVisible()
  })

  test('应该显示密码长度错误', async ({ page }) => {
    // 输入过短的密码
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', '123')
    await page.click('button[type="submit"]')

    // 检查密码长度错误
    await expect(page.locator('text=密码至少需要6个字符')).toBeVisible()
  })

  test('应该处理登录失败', async ({ page }) => {
    // 模拟登录失败的响应
    await page.route('**/api/auth/sign-in', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: '邮箱或密码错误' })
      })
    })

    // 填写登录表单
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // 检查错误消息
    await expect(page.locator('text=邮箱或密码错误')).toBeVisible()
  })

  test('应该成功登录并重定向到仪表板', async ({ page }) => {
    // 模拟成功登录的响应
    await page.route('**/api/auth/sign-in', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User'
          },
          session: {
            id: 'session-1',
            token: 'test-token'
          }
        })
      })
    })

    // 模拟仪表板页面
    await page.route('**/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body><h1>仪表板</h1></body></html>'
      })
    })

    // 填写登录表单
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 等待重定向到仪表板
    await page.waitForURL('**/dashboard')
    await expect(page.locator('h1')).toContainText('仪表板')
  })

  test('应该显示加载状态', async ({ page }) => {
    // 模拟慢速响应
    await page.route('**/api/auth/sign-in', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // 填写表单并提交
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 检查加载状态
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
    await expect(page.locator('text=登录中...')).toBeVisible()
  })

  test('应该支持键盘导航', async ({ page }) => {
    // 使用Tab键导航
    await page.keyboard.press('Tab')
    await expect(page.locator('input[type="email"]')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.locator('input[type="password"]')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.locator('button[type="submit"]')).toBeFocused()

    // 使用Enter键提交表单
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.locator('input[type="password"]').press('Enter')

    // 验证表单提交
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('应该记住用户选择', async ({ page }) => {
    // 检查"记住我"复选框
    const rememberCheckbox = page.locator('input[type="checkbox"]')
    await expect(rememberCheckbox).toBeVisible()

    // 勾选"记住我"
    await rememberCheckbox.check()
    await expect(rememberCheckbox).toBeChecked()

    // 取消勾选
    await rememberCheckbox.uncheck()
    await expect(rememberCheckbox).not.toBeChecked()
  })

  test('应该有注册链接', async ({ page }) => {
    // 检查注册链接
    const signUpLink = page.locator('text=还没有账户？注册')
    await expect(signUpLink).toBeVisible()

    // 点击注册链接
    await signUpLink.click()
    await expect(page).toHaveURL(/.*sign-up/)
  })

  test('应该有忘记密码链接', async ({ page }) => {
    // 检查忘记密码链接
    const forgotPasswordLink = page.locator('text=忘记密码？')
    await expect(forgotPasswordLink).toBeVisible()

    // 点击忘记密码链接
    await forgotPasswordLink.click()
    await expect(page).toHaveURL(/.*forgot-password/)
  })
})

test.describe('社交登录', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-in')
  })

  test('应该支持GitHub登录', async ({ page }) => {
    // 模拟GitHub OAuth重定向
    await page.route('**/api/auth/github', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': 'https://github.com/login/oauth/authorize?client_id=test'
        }
      })
    })

    // 点击GitHub登录按钮
    await page.click('text=GitHub')

    // 验证重定向到GitHub
    await page.waitForURL('**/github.com/**')
  })

  test('应该支持Google登录', async ({ page }) => {
    // 模拟Google OAuth重定向
    await page.route('**/api/auth/google', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': 'https://accounts.google.com/oauth/authorize?client_id=test'
        }
      })
    })

    // 点击Google登录按钮
    await page.click('text=Google')

    // 验证重定向到Google
    await page.waitForURL('**/accounts.google.com/**')
  })
})
