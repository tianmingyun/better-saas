import { test, expect } from '@playwright/test'

// 模拟已登录用户
test.use({
  storageState: {
    cookies: [
      {
        name: 'auth-token',
        value: 'mock-auth-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ],
    origins: []
  }
})

test.describe('仪表板导航', () => {
  test.beforeEach(async ({ page }) => {
    // 模拟用户会话验证
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user'
          },
          session: {
            id: 'session-1',
            token: 'test-token'
          }
        })
      })
    })

    await page.goto('/dashboard')
  })

  test('应该显示仪表板主页', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/仪表板|Dashboard/)

    // 检查主要导航元素
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('text=仪表板')).toBeVisible()
    await expect(page.locator('text=文件管理')).toBeVisible()
    await expect(page.locator('text=设置')).toBeVisible()
  })

  test('应该显示用户信息', async ({ page }) => {
    // 检查用户头像/菜单
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // 点击用户菜单
    await page.click('[data-testid="user-menu"]')
    
    // 检查下拉菜单
    await expect(page.locator('text=Test User')).toBeVisible()
    await expect(page.locator('text=test@example.com')).toBeVisible()
    await expect(page.locator('text=个人资料')).toBeVisible()
    await expect(page.locator('text=退出登录')).toBeVisible()
  })

  test('应该支持侧边栏导航', async ({ page }) => {
    // 检查侧边栏
    const sidebar = page.locator('[data-testid="sidebar"]')
    await expect(sidebar).toBeVisible()

    // 导航到文件管理
    await page.click('text=文件管理')
    await expect(page).toHaveURL(/.*files/)

    // 导航到设置
    await page.click('text=设置')
    await expect(page).toHaveURL(/.*settings/)

    // 返回仪表板
    await page.click('text=仪表板')
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('应该支持移动端导航', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 })

    // 检查移动端菜单按钮
    const menuButton = page.locator('[data-testid="mobile-menu-button"]')
    await expect(menuButton).toBeVisible()

    // 点击菜单按钮
    await menuButton.click()

    // 检查移动端菜单
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    await expect(mobileMenu).toBeVisible()

    // 检查导航项
    await expect(mobileMenu.locator('text=仪表板')).toBeVisible()
    await expect(mobileMenu.locator('text=文件管理')).toBeVisible()
    await expect(mobileMenu.locator('text=设置')).toBeVisible()
  })

  test('应该支持键盘导航', async ({ page }) => {
    // 使用Tab键导航
    await page.keyboard.press('Tab')
    
    // 检查焦点在第一个导航项
    await expect(page.locator('text=仪表板')).toBeFocused()

    // 继续Tab导航
    await page.keyboard.press('Tab')
    await expect(page.locator('text=文件管理')).toBeFocused()

    // 使用Enter键激活
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/.*files/)
  })

  test('应该显示面包屑导航', async ({ page }) => {
    // 导航到子页面
    await page.click('text=文件管理')
    
    // 检查面包屑
    const breadcrumb = page.locator('[data-testid="breadcrumb"]')
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb.locator('text=仪表板')).toBeVisible()
    await expect(breadcrumb.locator('text=文件管理')).toBeVisible()

    // 点击面包屑返回
    await breadcrumb.locator('text=仪表板').click()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('应该支持搜索功能', async ({ page }) => {
    // 检查搜索框
    const searchInput = page.locator('[data-testid="search-input"]')
    await expect(searchInput).toBeVisible()

    // 输入搜索内容
    await searchInput.fill('测试文件')
    await page.keyboard.press('Enter')

    // 检查搜索结果页面
    await expect(page).toHaveURL(/.*search/)
    await expect(page.locator('text=搜索结果')).toBeVisible()
  })

  test('应该显示通知', async ({ page }) => {
    // 模拟通知API
    await page.route('**/api/notifications', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          notifications: [
            {
              id: '1',
              title: '欢迎使用',
              message: '欢迎来到我们的平台！',
              type: 'info',
              createdAt: new Date().toISOString()
            }
          ]
        })
      })
    })

    // 检查通知图标
    const notificationButton = page.locator('[data-testid="notification-button"]')
    await expect(notificationButton).toBeVisible()

    // 点击通知
    await notificationButton.click()

    // 检查通知面板
    const notificationPanel = page.locator('[data-testid="notification-panel"]')
    await expect(notificationPanel).toBeVisible()
    await expect(notificationPanel.locator('text=欢迎使用')).toBeVisible()
  })

  test('应该支持主题切换', async ({ page }) => {
    // 检查主题切换按钮
    const themeToggle = page.locator('[data-testid="theme-toggle"]')
    await expect(themeToggle).toBeVisible()

    // 切换到暗色主题
    await themeToggle.click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    // 切换回亮色主题
    await themeToggle.click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('应该支持语言切换', async ({ page }) => {
    // 检查语言切换器
    const languageSelector = page.locator('[data-testid="language-selector"]')
    await expect(languageSelector).toBeVisible()

    // 切换到英文
    await languageSelector.click()
    await page.click('text=English')

    // 检查页面语言变化
    await expect(page.locator('text=Dashboard')).toBeVisible()

    // 切换回中文
    await languageSelector.click()
    await page.click('text=中文')
    await expect(page.locator('text=仪表板')).toBeVisible()
  })
})

test.describe('仪表板内容', () => {
  test.beforeEach(async ({ page }) => {
    // 模拟用户会话和仪表板数据
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'user-1', email: 'test@example.com', name: 'Test User' }
        })
      })
    })

    await page.route('**/api/dashboard/stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalFiles: 42,
          storageUsed: '2.5 GB',
          recentActivity: 15
        })
      })
    })

    await page.goto('/dashboard')
  })

  test('应该显示统计卡片', async ({ page }) => {
    // 检查统计卡片
    await expect(page.locator('[data-testid="stats-card"]')).toHaveCount(3)
    await expect(page.locator('text=42')).toBeVisible() // 文件数量
    await expect(page.locator('text=2.5 GB')).toBeVisible() // 存储使用
    await expect(page.locator('text=15')).toBeVisible() // 最近活动
  })

  test('应该显示最近文件', async ({ page }) => {
    // 模拟最近文件API
    await page.route('**/api/files/recent', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: [
            {
              id: 'file-1',
              name: 'document.pdf',
              size: '1.2 MB',
              updatedAt: new Date().toISOString()
            }
          ]
        })
      })
    })

    // 检查最近文件部分
    await expect(page.locator('[data-testid="recent-files"]')).toBeVisible()
    await expect(page.locator('text=document.pdf')).toBeVisible()
    await expect(page.locator('text=1.2 MB')).toBeVisible()
  })

  test('应该显示快速操作', async ({ page }) => {
    // 检查快速操作按钮
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible()
    await expect(page.locator('text=上传文件')).toBeVisible()
    await expect(page.locator('text=创建文件夹')).toBeVisible()
    await expect(page.locator('text=分享链接')).toBeVisible()

    // 测试快速上传
    await page.click('text=上传文件')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
  })
})
