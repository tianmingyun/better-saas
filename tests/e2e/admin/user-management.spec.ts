import { test, expect } from '@playwright/test'

// 模拟管理员用户
test.use({
  storageState: {
    cookies: [
      {
        name: 'auth-token',
        value: 'mock-admin-token',
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

test.describe('管理员用户管理', () => {
  test.beforeEach(async ({ page }) => {
    // 模拟管理员会话
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'admin-1',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin'
          }
        })
      })
    })

    // 模拟用户列表API
    await page.route('**/api/admin/users', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            {
              id: 'user-1',
              email: 'user1@example.com',
              name: 'User One',
              role: 'user',
              emailVerified: true,
              banned: false,
              createdAt: '2024-01-01T00:00:00.000Z',
              lastLoginAt: '2024-01-15T10:30:00.000Z'
            },
            {
              id: 'user-2',
              email: 'user2@example.com',
              name: 'User Two',
              role: 'user',
              emailVerified: false,
              banned: true,
              banReason: 'Spam',
              createdAt: '2024-01-02T00:00:00.000Z',
              lastLoginAt: null
            }
          ],
          total: 2,
          page: 1,
          limit: 10
        })
      })
    })

    await page.goto('/admin/users')
  })

  test('应该显示用户管理页面', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/用户管理|User Management/)

    // 检查管理员导航
    await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible()
    await expect(page.locator('text=用户管理')).toBeVisible()
    await expect(page.locator('text=系统设置')).toBeVisible()

    // 检查用户列表
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible()
    await expect(page.locator('text=user1@example.com')).toBeVisible()
    await expect(page.locator('text=user2@example.com')).toBeVisible()
  })

  test('应该显示用户详细信息', async ({ page }) => {
    // 检查用户状态
    await expect(page.locator('[data-testid="user-status-user-1"]')).toContainText('正常')
    await expect(page.locator('[data-testid="user-status-user-2"]')).toContainText('已封禁')

    // 检查邮箱验证状态
    await expect(page.locator('[data-testid="email-verified-user-1"]')).toContainText('已验证')
    await expect(page.locator('[data-testid="email-verified-user-2"]')).toContainText('未验证')

    // 检查最后登录时间
    await expect(page.locator('[data-testid="last-login-user-1"]')).toContainText('2024-01-15')
    await expect(page.locator('[data-testid="last-login-user-2"]')).toContainText('从未登录')
  })

  test('应该支持用户搜索', async ({ page }) => {
    // 输入搜索关键词
    const searchInput = page.locator('[data-testid="user-search"]')
    await searchInput.fill('user1@example.com')

    // 检查搜索结果
    await expect(page.locator('text=user1@example.com')).toBeVisible()
    await expect(page.locator('text=user2@example.com')).not.toBeVisible()

    // 清空搜索
    await searchInput.fill('')
    await expect(page.locator('text=user2@example.com')).toBeVisible()
  })

  test('应该支持用户过滤', async ({ page }) => {
    // 点击过滤按钮
    await page.click('[data-testid="filter-button"]')

    // 检查过滤面板
    const filterPanel = page.locator('[data-testid="filter-panel"]')
    await expect(filterPanel).toBeVisible()

    // 过滤已封禁用户
    await page.click('[data-testid="filter-banned"]')

    // 检查过滤结果
    await expect(page.locator('text=user2@example.com')).toBeVisible()
    await expect(page.locator('text=user1@example.com')).not.toBeVisible()

    // 过滤未验证邮箱用户
    await page.click('[data-testid="filter-unverified"]')
    await expect(page.locator('text=user2@example.com')).toBeVisible()
  })

  test('应该支持封禁用户', async ({ page }) => {
    // 模拟封禁API
    await page.route('**/api/admin/users/user-1/ban', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // 点击封禁按钮
    await page.click('[data-testid="ban-user-1"]')

    // 检查封禁对话框
    const banDialog = page.locator('[data-testid="ban-dialog"]')
    await expect(banDialog).toBeVisible()

    // 填写封禁原因
    await page.fill('[data-testid="ban-reason"]', '违反社区规定')

    // 设置封禁期限
    await page.selectOption('[data-testid="ban-duration"]', '7')

    // 确认封禁
    await page.click('[data-testid="confirm-ban"]')

    // 检查成功消息
    await expect(page.locator('text=用户封禁成功')).toBeVisible()

    // 检查用户状态更新
    await expect(page.locator('[data-testid="user-status-user-1"]')).toContainText('已封禁')
  })

  test('应该支持解封用户', async ({ page }) => {
    // 模拟解封API
    await page.route('**/api/admin/users/user-2/unban', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // 点击解封按钮
    await page.click('[data-testid="unban-user-2"]')

    // 检查确认对话框
    const confirmDialog = page.locator('[data-testid="confirm-dialog"]')
    await expect(confirmDialog).toBeVisible()
    await expect(confirmDialog.locator('text=确定要解封此用户吗？')).toBeVisible()

    // 确认解封
    await page.click('[data-testid="confirm-unban"]')

    // 检查成功消息
    await expect(page.locator('text=用户解封成功')).toBeVisible()

    // 检查用户状态更新
    await expect(page.locator('[data-testid="user-status-user-2"]')).toContainText('正常')
  })

  test('应该支持删除用户', async ({ page }) => {
    // 模拟删除API
    await page.route('**/api/admin/users/user-1', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // 点击删除按钮
    await page.click('[data-testid="delete-user-1"]')

    // 检查危险操作确认对话框
    const dangerDialog = page.locator('[data-testid="danger-dialog"]')
    await expect(dangerDialog).toBeVisible()
    await expect(dangerDialog.locator('text=此操作不可撤销')).toBeVisible()

    // 输入确认文本
    await page.fill('[data-testid="confirm-text"]', 'DELETE')

    // 确认删除
    await page.click('[data-testid="confirm-delete"]')

    // 检查成功消息
    await expect(page.locator('text=用户删除成功')).toBeVisible()

    // 检查用户从列表中移除
    await expect(page.locator('text=user1@example.com')).not.toBeVisible()
  })

  test('应该支持查看用户详情', async ({ page }) => {
    // 点击用户详情按钮
    await page.click('[data-testid="view-user-1"]')

    // 检查用户详情模态框
    const userModal = page.locator('[data-testid="user-detail-modal"]')
    await expect(userModal).toBeVisible()

    // 检查用户信息
    await expect(userModal.locator('text=User One')).toBeVisible()
    await expect(userModal.locator('text=user1@example.com')).toBeVisible()
    await expect(userModal.locator('text=2024-01-01')).toBeVisible()

    // 检查用户活动日志
    await expect(userModal.locator('[data-testid="activity-log"]')).toBeVisible()

    // 关闭模态框
    await page.click('[data-testid="close-modal"]')
    await expect(userModal).not.toBeVisible()
  })

  test('应该支持批量操作', async ({ page }) => {
    // 选择多个用户
    await page.click('[data-testid="checkbox-user-1"]')
    await page.click('[data-testid="checkbox-user-2"]')

    // 检查批量操作栏
    const batchActions = page.locator('[data-testid="batch-actions"]')
    await expect(batchActions).toBeVisible()
    await expect(batchActions.locator('text=已选择 2 个用户')).toBeVisible()

    // 检查批量操作按钮
    await expect(batchActions.locator('[data-testid="batch-ban"]')).toBeVisible()
    await expect(batchActions.locator('[data-testid="batch-delete"]')).toBeVisible()
    await expect(batchActions.locator('[data-testid="batch-export"]')).toBeVisible()
  })

  test('应该支持导出用户数据', async ({ page }) => {
    // 模拟导出API
    await page.route('**/api/admin/users/export', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="users.csv"'
        },
        body: 'id,email,name,role,created_at\nuser-1,user1@example.com,User One,user,2024-01-01'
      })
    })

    // 点击导出按钮
    await page.click('[data-testid="export-users"]')

    // 等待下载开始
    const downloadPromise = page.waitForEvent('download')
    const download = await downloadPromise

    // 检查下载文件名
    expect(download.suggestedFilename()).toBe('users.csv')
  })

  test('应该支持用户统计', async ({ page }) => {
    // 模拟统计API
    await page.route('**/api/admin/stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUsers: 1250,
          activeUsers: 890,
          bannedUsers: 15,
          newUsersToday: 23
        })
      })
    })

    // 检查统计卡片
    await expect(page.locator('[data-testid="stats-total"]')).toContainText('1,250')
    await expect(page.locator('[data-testid="stats-active"]')).toContainText('890')
    await expect(page.locator('[data-testid="stats-banned"]')).toContainText('15')
    await expect(page.locator('[data-testid="stats-new"]')).toContainText('23')
  })

  test('应该支持分页和排序', async ({ page }) => {
    // 检查分页控件
    const pagination = page.locator('[data-testid="pagination"]')
    await expect(pagination).toBeVisible()

    // 点击排序
    await page.click('[data-testid="sort-email"]')
    await expect(page.locator('[data-testid="sort-email"] .sort-asc')).toBeVisible()

    // 点击日期排序
    await page.click('[data-testid="sort-created"]')
    await expect(page.locator('[data-testid="sort-created"] .sort-asc')).toBeVisible()
  })
})
