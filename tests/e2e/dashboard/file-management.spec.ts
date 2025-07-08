import { test, expect } from '@playwright/test'
import path from 'path'

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

test.describe('文件管理', () => {
  test.beforeEach(async ({ page }) => {
    // 模拟用户会话
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User'
          }
        })
      })
    })

    // 模拟文件列表API
    await page.route('**/api/files', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: [
            {
              id: 'file-1',
              filename: 'document.pdf',
              originalName: 'important-document.pdf',
              mimeType: 'application/pdf',
              size: 1024000,
              createdAt: new Date().toISOString()
            },
            {
              id: 'file-2',
              filename: 'image.jpg',
              originalName: 'vacation-photo.jpg',
              mimeType: 'image/jpeg',
              size: 2048000,
              width: 1920,
              height: 1080,
              createdAt: new Date().toISOString()
            }
          ],
          total: 2,
          page: 1,
          limit: 10
        })
      })
    })

    await page.goto('/dashboard/files')
  })

  test('应该显示文件列表', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/文件管理|Files/)

    // 检查文件列表
    await expect(page.locator('[data-testid="file-list"]')).toBeVisible()
    await expect(page.locator('text=document.pdf')).toBeVisible()
    await expect(page.locator('text=image.jpg')).toBeVisible()

    // 检查文件信息
    await expect(page.locator('text=1.0 MB')).toBeVisible() // PDF文件大小
    await expect(page.locator('text=2.0 MB')).toBeVisible() // 图片文件大小
  })

  test('应该支持文件上传', async ({ page }) => {
    // 模拟文件上传API
    await page.route('**/api/files/upload', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          file: {
            id: 'file-3',
            filename: 'new-file.txt',
            originalName: 'test-file.txt',
            mimeType: 'text/plain',
            size: 1024,
            createdAt: new Date().toISOString()
          }
        })
      })
    })

    // 点击上传按钮
    await page.click('[data-testid="upload-button"]')

    // 检查上传模态框
    const uploadModal = page.locator('[data-testid="upload-modal"]')
    await expect(uploadModal).toBeVisible()

    // 创建测试文件
    const testFilePath = path.join(__dirname, '../../fixtures/test-file.txt')
    
    // 模拟文件选择（在实际测试中，你需要准备测试文件）
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeVisible()

    // 点击上传按钮
    await page.click('[data-testid="upload-submit"]')

    // 检查上传成功消息
    await expect(page.locator('text=文件上传成功')).toBeVisible()

    // 检查模态框关闭
    await expect(uploadModal).not.toBeVisible()
  })

  test('应该支持拖拽上传', async ({ page }) => {
    // 检查拖拽区域
    const dropZone = page.locator('[data-testid="drop-zone"]')
    await expect(dropZone).toBeVisible()

    // 模拟拖拽事件
    await dropZone.dispatchEvent('dragover', {
      dataTransfer: {
        files: [
          {
            name: 'dragged-file.jpg',
            type: 'image/jpeg',
            size: 1024000
          }
        ]
      }
    })

    // 检查拖拽状态
    await expect(dropZone).toHaveClass(/drag-over/)

    // 模拟放置事件
    await dropZone.dispatchEvent('drop', {
      dataTransfer: {
        files: [
          {
            name: 'dragged-file.jpg',
            type: 'image/jpeg',
            size: 1024000
          }
        ]
      }
    })

    // 检查上传开始
    await expect(page.locator('text=正在上传...')).toBeVisible()
  })

  test('应该支持文件预览', async ({ page }) => {
    // 点击图片文件
    await page.click('[data-testid="file-item-file-2"]')

    // 检查预览模态框
    const previewModal = page.locator('[data-testid="preview-modal"]')
    await expect(previewModal).toBeVisible()

    // 检查图片预览
    await expect(previewModal.locator('img')).toBeVisible()
    await expect(previewModal.locator('text=vacation-photo.jpg')).toBeVisible()
    await expect(previewModal.locator('text=1920 × 1080')).toBeVisible()

    // 关闭预览
    await page.click('[data-testid="close-preview"]')
    await expect(previewModal).not.toBeVisible()
  })

  test('应该支持文件下载', async ({ page }) => {
    // 模拟下载API
    await page.route('**/api/files/file-1/download', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="document.pdf"'
        },
        body: 'PDF content'
      })
    })

    // 点击下载按钮
    await page.click('[data-testid="download-file-1"]')

    // 等待下载开始
    const downloadPromise = page.waitForEvent('download')
    const download = await downloadPromise

    // 检查下载文件名
    expect(download.suggestedFilename()).toBe('document.pdf')
  })

  test('应该支持文件删除', async ({ page }) => {
    // 模拟删除API
    await page.route('**/api/files/file-1', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // 点击删除按钮
    await page.click('[data-testid="delete-file-1"]')

    // 检查确认对话框
    const confirmDialog = page.locator('[data-testid="confirm-dialog"]')
    await expect(confirmDialog).toBeVisible()
    await expect(confirmDialog.locator('text=确定要删除这个文件吗？')).toBeVisible()

    // 确认删除
    await page.click('[data-testid="confirm-delete"]')

    // 检查删除成功消息
    await expect(page.locator('text=文件删除成功')).toBeVisible()

    // 检查文件从列表中移除
    await expect(page.locator('text=document.pdf')).not.toBeVisible()
  })

  test('应该支持批量操作', async ({ page }) => {
    // 选择多个文件
    await page.click('[data-testid="checkbox-file-1"]')
    await page.click('[data-testid="checkbox-file-2"]')

    // 检查批量操作栏
    const batchActions = page.locator('[data-testid="batch-actions"]')
    await expect(batchActions).toBeVisible()
    await expect(batchActions.locator('text=已选择 2 个文件')).toBeVisible()

    // 检查批量操作按钮
    await expect(batchActions.locator('[data-testid="batch-download"]')).toBeVisible()
    await expect(batchActions.locator('[data-testid="batch-delete"]')).toBeVisible()
  })

  test('应该支持文件搜索', async ({ page }) => {
    // 输入搜索关键词
    const searchInput = page.locator('[data-testid="file-search"]')
    await searchInput.fill('document')

    // 检查搜索结果
    await expect(page.locator('text=document.pdf')).toBeVisible()
    await expect(page.locator('text=image.jpg')).not.toBeVisible()

    // 清空搜索
    await searchInput.fill('')
    await expect(page.locator('text=image.jpg')).toBeVisible()
  })

  test('应该支持文件排序', async ({ page }) => {
    // 点击名称排序
    await page.click('[data-testid="sort-name"]')
    
    // 检查排序指示器
    await expect(page.locator('[data-testid="sort-name"] .sort-asc')).toBeVisible()

    // 再次点击切换排序方向
    await page.click('[data-testid="sort-name"]')
    await expect(page.locator('[data-testid="sort-name"] .sort-desc')).toBeVisible()

    // 点击大小排序
    await page.click('[data-testid="sort-size"]')
    await expect(page.locator('[data-testid="sort-size"] .sort-asc')).toBeVisible()
  })

  test('应该支持文件过滤', async ({ page }) => {
    // 点击过滤按钮
    await page.click('[data-testid="filter-button"]')

    // 检查过滤面板
    const filterPanel = page.locator('[data-testid="filter-panel"]')
    await expect(filterPanel).toBeVisible()

    // 选择文件类型过滤
    await page.click('[data-testid="filter-images"]')

    // 检查过滤结果
    await expect(page.locator('text=image.jpg')).toBeVisible()
    await expect(page.locator('text=document.pdf')).not.toBeVisible()

    // 清除过滤
    await page.click('[data-testid="clear-filters"]')
    await expect(page.locator('text=document.pdf')).toBeVisible()
  })

  test('应该支持分页', async ({ page }) => {
    // 模拟更多文件数据
    await page.route('**/api/files?page=2', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: [
            {
              id: 'file-3',
              filename: 'page2-file.txt',
              originalName: 'page2-file.txt',
              mimeType: 'text/plain',
              size: 512,
              createdAt: new Date().toISOString()
            }
          ],
          total: 3,
          page: 2,
          limit: 2
        })
      })
    })

    // 检查分页控件
    const pagination = page.locator('[data-testid="pagination"]')
    await expect(pagination).toBeVisible()

    // 点击下一页
    await page.click('[data-testid="next-page"]')

    // 检查页面变化
    await expect(page.locator('text=page2-file.txt')).toBeVisible()
    await expect(page.locator('text=document.pdf')).not.toBeVisible()
  })
})
