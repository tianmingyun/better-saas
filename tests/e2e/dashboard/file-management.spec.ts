import { test, expect } from '../fixtures/test-setup';
import { TEST_USERS, TEST_DATA } from '../utils/test-helpers';

test.describe('文件管理功能测试', () => {
  test.beforeEach(async ({ page, authHelper }) => {
    // 清除状态并以管理员身份登录
    await page.context().clearCookies();
    // 先导航到一个页面，然后清除存储
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // 管理员登录
    await authHelper.loginAsAdmin();
    
    // 导航到文件管理页面
    await page.goto('/dashboard/files');
  });

  test.describe('文件管理界面', () => {
    test('应该显示文件管理器界面', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      // 等待页面加载完成
      await waitHelper.waitForLoadingComplete();
      
      // 验证文件管理器主要元素
      await assertionHelper.assertElementVisible('[data-testid="file-manager"]');
      await assertionHelper.assertElementVisible('[data-testid="file-upload-area"]');
      await assertionHelper.assertElementVisible('[data-testid="file-list"]');
      await assertionHelper.assertElementVisible('[data-testid="file-toolbar"]');
    });

    test('应该显示文件上传区域', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 验证上传区域元素
      await assertionHelper.assertElementVisible('[data-testid="upload-dropzone"]');
      await assertionHelper.assertElementVisible('[data-testid="upload-button"]');
      await assertionHelper.assertElementVisible('[data-testid="upload-instructions"]');
      
      // 验证上传说明文本
      await assertionHelper.assertTextContent(
        '[data-testid="upload-instructions"]', 
        '拖拽文件到此处或点击上传'
      );
    });

    test('应该显示文件工具栏', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 验证工具栏按钮
      await assertionHelper.assertElementVisible('[data-testid="view-grid-button"]');
      await assertionHelper.assertElementVisible('[data-testid="view-list-button"]');
      await assertionHelper.assertElementVisible('[data-testid="sort-button"]');
      await assertionHelper.assertElementVisible('[data-testid="filter-button"]');
      await assertionHelper.assertElementVisible('[data-testid="search-files"]');
    });

    test('应该显示文件统计信息', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 验证统计卡片
      await assertionHelper.assertElementVisible('[data-testid="stats-total-files"]');
      await assertionHelper.assertElementVisible('[data-testid="stats-total-size"]');
      await assertionHelper.assertElementVisible('[data-testid="stats-recent-uploads"]');
      
      // 验证统计数据显示
      const totalFiles = await page.textContent('[data-testid="stats-total-files"] .text-2xl');
      const totalSize = await page.textContent('[data-testid="stats-total-size"] .text-2xl');
      
      expect(parseInt(totalFiles || '0')).toBeGreaterThanOrEqual(0);
      expect(totalSize).toBeTruthy();
    });
  });

  test.describe('文件上传功能', () => {
    test('应该能够通过点击上传文件', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击上传按钮
      await page.click('[data-testid="upload-button"]');
      
      // 验证文件选择器打开
      const fileInput = page.locator('[data-testid="file-input"]');
      await expect(fileInput).toBeVisible();
      
      // 模拟文件选择
      await fileInput.setInputFiles([{
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('test image content')
      }]);
      
      // 验证上传进度显示
      await assertionHelper.assertElementVisible('[data-testid="upload-progress"]');
      
      // 等待上传完成
      await formHelper.waitForSuccessMessage('文件上传成功');
      
      // 验证文件出现在列表中
      await assertionHelper.assertElementVisible('[data-testid="file-item"]');
      await assertionHelper.assertTextContent('[data-testid="file-name"]', 'test-image.jpg');
    });

    test('应该能够通过拖拽上传文件', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 模拟拖拽文件到上传区域
      const dropzone = page.locator('[data-testid="upload-dropzone"]');
      
      // 创建文件数据
      const fileData = {
        name: 'drag-test.png',
        type: 'image/png',
        size: 1024
      };
      
      // 模拟拖拽事件
      await dropzone.dispatchEvent('dragenter', { dataTransfer: { files: [fileData] } });
      await dropzone.dispatchEvent('dragover', { dataTransfer: { files: [fileData] } });
      await dropzone.dispatchEvent('drop', { dataTransfer: { files: [fileData] } });
      
      // 验证上传进度显示
      await assertionHelper.assertElementVisible('[data-testid="upload-progress"]');
      
      // 等待上传完成
      await formHelper.waitForSuccessMessage('文件上传成功');
      
      // 验证文件出现在列表中
      await assertionHelper.assertTextContent('[data-testid="file-name"]', 'drag-test.png');
    });

    test('应该能够上传多个文件', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 选择多个文件
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles([
        {
          name: 'file1.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('file1 content')
        },
        {
          name: 'file2.png',
          mimeType: 'image/png',
          buffer: Buffer.from('file2 content')
        }
      ]);
      
      // 验证批量上传进度
      await assertionHelper.assertElementVisible('[data-testid="batch-upload-progress"]');
      
      // 等待所有文件上传完成
      await formHelper.waitForSuccessMessage('2 个文件上传成功');
      
      // 验证文件都出现在列表中
      await assertionHelper.assertElementVisible('[data-testid="file-item"]:has-text("file1.jpg")');
      await assertionHelper.assertElementVisible('[data-testid="file-item"]:has-text("file2.png")');
    });

    test('应该拒绝不支持的文件类型', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 尝试上传不支持的文件类型
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles([{
        name: 'malicious.exe',
        mimeType: 'application/x-msdownload',
        buffer: Buffer.from('malicious content')
      }]);
      
      // 验证错误消息
      await formHelper.waitForErrorMessage('不支持的文件类型');
      
      // 验证文件未出现在列表中
      await assertionHelper.assertElementHidden('[data-testid="file-item"]:has-text("malicious.exe")');
    });

    test('应该拒绝超过大小限制的文件', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 创建大文件 (模拟超过10MB)
      const largeFileBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles([{
        name: 'large-file.jpg',
        mimeType: 'image/jpeg',
        buffer: largeFileBuffer
      }]);
      
      // 验证错误消息
      await formHelper.waitForErrorMessage('文件大小超过限制');
      
      // 验证文件未出现在列表中
      await assertionHelper.assertElementHidden('[data-testid="file-item"]:has-text("large-file.jpg")');
    });

    test('应该显示上传进度', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 模拟慢速上传
      await page.route('**/api/files/upload', route => {
        // 延迟响应以显示进度
        setTimeout(() => {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ success: true, fileId: 'test-id' })
          });
        }, 2000);
      });
      
      // 上传文件
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles([{
        name: 'slow-upload.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('slow upload content')
      }]);
      
      // 验证进度条显示
      await assertionHelper.assertElementVisible('[data-testid="upload-progress"]');
      await assertionHelper.assertElementVisible('[data-testid="progress-bar"]');
      await assertionHelper.assertElementVisible('[data-testid="progress-text"]');
      
      // 验证进度百分比
      const progressText = await page.textContent('[data-testid="progress-text"]');
      expect(progressText).toMatch(/\d+%/);
    });
  });

  test.describe('文件列表和显示', () => {
    test('应该能够切换网格和列表视图', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 默认应该是网格视图
      await assertionHelper.assertElementVisible('[data-testid="file-grid"]');
      
      // 切换到列表视图
      await page.click('[data-testid="view-list-button"]');
      
      // 验证切换到列表视图
      await assertionHelper.assertElementVisible('[data-testid="file-list-view"]');
      await assertionHelper.assertElementHidden('[data-testid="file-grid"]');
      
      // 切换回网格视图
      await page.click('[data-testid="view-grid-button"]');
      
      // 验证切换回网格视图
      await assertionHelper.assertElementVisible('[data-testid="file-grid"]');
      await assertionHelper.assertElementHidden('[data-testid="file-list-view"]');
    });

    test('应该显示文件缩略图', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 上传图片文件
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles([{
        name: 'thumbnail-test.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('thumbnail test content')
      }]);
      
      // 等待上传完成
      await waitHelper.waitForLoadingComplete();
      
      // 验证缩略图显示
      const fileItem = page.locator('[data-testid="file-item"]:has-text("thumbnail-test.jpg")');
      await expect(fileItem.locator('[data-testid="file-thumbnail"]')).toBeVisible();
      
      // 验证缩略图是图片
      const thumbnail = fileItem.locator('[data-testid="file-thumbnail"] img');
      await expect(thumbnail).toBeVisible();
      
      // 验证缩略图有正确的src属性
      const src = await thumbnail.getAttribute('src');
      expect(src).toBeTruthy();
    });

    test('应该显示文件信息', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 假设已有文件，验证文件信息显示
      const fileItem = page.locator('[data-testid="file-item"]').first();
      
      if (await fileItem.count() > 0) {
        // 验证文件名
        await expect(fileItem.locator('[data-testid="file-name"]')).toBeVisible();
        
        // 验证文件大小
        await expect(fileItem.locator('[data-testid="file-size"]')).toBeVisible();
        
        // 验证文件类型
        await expect(fileItem.locator('[data-testid="file-type"]')).toBeVisible();
        
        // 验证上传时间
        await expect(fileItem.locator('[data-testid="file-date"]')).toBeVisible();
        
        // 验证文件操作按钮
        await expect(fileItem.locator('[data-testid="file-actions"]')).toBeVisible();
      }
    });

    test('应该能够搜索文件', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 验证搜索框
      await assertionHelper.assertElementVisible('[data-testid="search-files"]');
      
      // 输入搜索关键词
      await page.fill('[data-testid="search-files"]', 'test');
      
      // 等待搜索结果
      await waitHelper.waitForApiResponse('**/api/files**');
      
      // 验证搜索结果
      const searchResults = page.locator('[data-testid="file-item"]');
      const count = await searchResults.count();
      
      if (count > 0) {
        // 验证搜索结果包含关键词
        const firstResult = searchResults.first();
        const fileName = await firstResult.locator('[data-testid="file-name"]').textContent();
        expect(fileName?.toLowerCase().includes('test')).toBe(true);
      }
    });

    test('应该能够按文件类型过滤', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击过滤按钮
      await page.click('[data-testid="filter-button"]');
      
      // 验证过滤选项显示
      await assertionHelper.assertElementVisible('[data-testid="filter-options"]');
      await assertionHelper.assertElementVisible('[data-testid="filter-images"]');
      await assertionHelper.assertElementVisible('[data-testid="filter-documents"]');
      await assertionHelper.assertElementVisible('[data-testid="filter-videos"]');
      
      // 选择图片过滤
      await page.click('[data-testid="filter-images"]');
      
      // 等待过滤结果
      await waitHelper.waitForApiResponse('**/api/files**');
      
      // 验证只显示图片文件
      const fileItems = page.locator('[data-testid="file-item"]');
      const count = await fileItems.count();
      
      for (let i = 0; i < count; i++) {
        const fileItem = fileItems.nth(i);
        const fileType = await fileItem.locator('[data-testid="file-type"]').textContent();
        expect(fileType?.toLowerCase()).toContain('image');
      }
    });

    test('应该能够按日期排序', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击排序按钮
      await page.click('[data-testid="sort-button"]');
      
      // 验证排序选项显示
      await assertionHelper.assertElementVisible('[data-testid="sort-options"]');
      await assertionHelper.assertElementVisible('[data-testid="sort-date"]');
      await assertionHelper.assertElementVisible('[data-testid="sort-name"]');
      await assertionHelper.assertElementVisible('[data-testid="sort-size"]');
      
      // 选择按日期排序
      await page.click('[data-testid="sort-date"]');
      
      // 等待排序结果
      await waitHelper.waitForApiResponse('**/api/files**');
      
      // 验证排序指示器显示
      await assertionHelper.assertElementVisible('[data-testid="sort-indicator"]');
    });
  });

  test.describe('文件操作', () => {
    test('应该能够预览图片文件', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 上传图片文件
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles([{
        name: 'preview-test.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('preview test content')
      }]);
      
      await waitHelper.waitForLoadingComplete();
      
      // 点击文件预览
      const fileItem = page.locator('[data-testid="file-item"]:has-text("preview-test.jpg")');
      await fileItem.click();
      
      // 验证预览模态框显示
      await assertionHelper.assertElementVisible('[data-testid="file-preview-modal"]');
      await assertionHelper.assertElementVisible('[data-testid="preview-image"]');
      await assertionHelper.assertElementVisible('[data-testid="preview-info"]');
      
      // 验证预览操作按钮
      await assertionHelper.assertElementVisible('[data-testid="preview-download"]');
      await assertionHelper.assertElementVisible('[data-testid="preview-close"]');
    });

    test('应该能够下载文件', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 假设已有文件
      const fileItem = page.locator('[data-testid="file-item"]').first();
      
      if (await fileItem.count() > 0) {
        // 点击下载按钮
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          fileItem.locator('[data-testid="download-button"]').click()
        ]);
        
        // 验证下载
        expect(download.suggestedFilename()).toBeTruthy();
      }
    });

    test('应该能够重命名文件', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 上传测试文件
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles([{
        name: 'rename-test.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('rename test content')
      }]);
      
      await waitHelper.waitForLoadingComplete();
      
      // 点击重命名按钮
      const fileItem = page.locator('[data-testid="file-item"]:has-text("rename-test.jpg")');
      await fileItem.locator('[data-testid="rename-button"]').click();
      
      // 验证重命名对话框显示
      await assertionHelper.assertElementVisible('[data-testid="rename-dialog"]');
      await assertionHelper.assertElementVisible('[data-testid="rename-input"]');
      
      // 输入新名称
      await page.fill('[data-testid="rename-input"]', 'renamed-file.jpg');
      
      // 确认重命名
      await page.click('[data-testid="confirm-rename"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('文件重命名成功');
      
      // 验证文件名更新
      await assertionHelper.assertElementVisible('[data-testid="file-item"]:has-text("renamed-file.jpg")');
    });

    test('应该能够删除文件', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 上传测试文件
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles([{
        name: 'delete-test.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('delete test content')
      }]);
      
      await waitHelper.waitForLoadingComplete();
      
      // 记录初始文件数量
      const initialCount = await page.locator('[data-testid="file-item"]').count();
      
      // 点击删除按钮
      const fileItem = page.locator('[data-testid="file-item"]:has-text("delete-test.jpg")');
      await fileItem.locator('[data-testid="delete-button"]').click();
      
      // 验证确认对话框显示
      await assertionHelper.assertElementVisible('[data-testid="confirm-dialog"]');
      await assertionHelper.assertTextContent('[data-testid="confirm-dialog-title"]', '删除文件');
      
      // 确认删除
      await page.click('[data-testid="confirm-button"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('文件删除成功');
      
      // 验证文件从列表中消失
      await assertionHelper.assertElementHidden('[data-testid="file-item"]:has-text("delete-test.jpg")');
      
      // 验证文件数量减少
      const finalCount = await page.locator('[data-testid="file-item"]').count();
      expect(finalCount).toBe(initialCount - 1);
    });

    test('应该能够复制文件链接', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 假设已有文件
      const fileItem = page.locator('[data-testid="file-item"]').first();
      
      if (await fileItem.count() > 0) {
        // 点击复制链接按钮
        await fileItem.locator('[data-testid="copy-link-button"]').click();
        
        // 验证成功消息
        await formHelper.waitForSuccessMessage('链接已复制到剪贴板');
      }
    });

    test('应该能够设置文件权限', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 假设已有文件
      const fileItem = page.locator('[data-testid="file-item"]').first();
      
      if (await fileItem.count() > 0) {
        // 点击权限设置按钮
        await fileItem.locator('[data-testid="permissions-button"]').click();
        
        // 验证权限对话框显示
        await assertionHelper.assertElementVisible('[data-testid="permissions-dialog"]');
        await assertionHelper.assertElementVisible('[data-testid="permission-public"]');
        await assertionHelper.assertElementVisible('[data-testid="permission-private"]');
        await assertionHelper.assertElementVisible('[data-testid="permission-shared"]');
        
        // 选择公开权限
        await page.click('[data-testid="permission-public"]');
        
        // 保存权限设置
        await page.click('[data-testid="save-permissions"]');
        
        // 验证权限更新
        await expect(fileItem.locator('[data-testid="public-badge"]')).toBeVisible();
      }
    });
  });

  test.describe('批量操作', () => {
    test('应该能够选择多个文件', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 上传多个测试文件
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles([
        {
          name: 'batch1.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('batch1 content')
        },
        {
          name: 'batch2.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('batch2 content')
        }
      ]);
      
      await waitHelper.waitForLoadingComplete();
      
      // 选择第一个文件
      await page.click('[data-testid="file-item"]:has-text("batch1.jpg") [data-testid="file-checkbox"]');
      
      // 验证选择状态
      await expect(page.locator('[data-testid="file-item"]:has-text("batch1.jpg") [data-testid="file-checkbox"]')).toBeChecked();
      
      // 验证批量操作栏显示
      await assertionHelper.assertElementVisible('[data-testid="batch-actions-bar"]');
      await assertionHelper.assertTextContent('[data-testid="selected-count"]', '1');
      
      // 选择第二个文件
      await page.click('[data-testid="file-item"]:has-text("batch2.jpg") [data-testid="file-checkbox"]');
      
      // 验证选择数量更新
      await assertionHelper.assertTextContent('[data-testid="selected-count"]', '2');
    });

    test('应该能够全选所有文件', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击全选按钮
      await page.click('[data-testid="select-all-button"]');
      
      // 验证所有文件被选中
      const fileCheckboxes = page.locator('[data-testid="file-checkbox"]');
      const count = await fileCheckboxes.count();
      
      for (let i = 0; i < count; i++) {
        await expect(fileCheckboxes.nth(i)).toBeChecked();
      }
      
      // 验证批量操作栏显示正确数量
      await assertionHelper.assertTextContent('[data-testid="selected-count"]', count.toString());
    });

    test('应该能够批量下载文件', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 选择多个文件
      await page.click('[data-testid="file-item"] [data-testid="file-checkbox"]');
      
      // 点击批量下载按钮
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="batch-download-button"]')
      ]);
      
      // 验证下载压缩包
      expect(download.suggestedFilename()).toContain('.zip');
    });

    test('应该能够批量删除文件', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 上传多个测试文件
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles([
        {
          name: 'delete1.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('delete1 content')
        },
        {
          name: 'delete2.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('delete2 content')
        }
      ]);
      
      await waitHelper.waitForLoadingComplete();
      
      // 记录初始文件数量
      const initialCount = await page.locator('[data-testid="file-item"]').count();
      
      // 选择要删除的文件
      await page.click('[data-testid="file-item"]:has-text("delete1.jpg") [data-testid="file-checkbox"]');
      await page.click('[data-testid="file-item"]:has-text("delete2.jpg") [data-testid="file-checkbox"]');
      
      // 点击批量删除按钮
      await page.click('[data-testid="batch-delete-button"]');
      
      // 验证确认对话框显示
      await assertionHelper.assertElementVisible('[data-testid="confirm-dialog"]');
      await assertionHelper.assertTextContent('[data-testid="confirm-dialog-title"]', '批量删除文件');
      
      // 确认删除
      await page.click('[data-testid="confirm-button"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('文件已批量删除');
      
      // 验证文件数量减少
      const finalCount = await page.locator('[data-testid="file-item"]').count();
      expect(finalCount).toBe(initialCount - 2);
    });

    test('应该能够批量移动文件', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 选择多个文件
      await page.click('[data-testid="file-item"] [data-testid="file-checkbox"]');
      
      // 点击批量移动按钮
      await page.click('[data-testid="batch-move-button"]');
      
      // 验证文件夹选择对话框显示
      await assertionHelper.assertElementVisible('[data-testid="folder-select-dialog"]');
      await assertionHelper.assertElementVisible('[data-testid="folder-list"]');
      
      // 选择目标文件夹
      await page.click('[data-testid="folder-item"]:has-text("Documents")');
      
      // 确认移动
      await page.click('[data-testid="confirm-move"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('文件已移动');
    });
  });

  test.describe('文件夹管理', () => {
    test('应该能够创建文件夹', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击创建文件夹按钮
      await page.click('[data-testid="create-folder-button"]');
      
      // 验证创建文件夹对话框显示
      await assertionHelper.assertElementVisible('[data-testid="create-folder-dialog"]');
      await assertionHelper.assertElementVisible('[data-testid="folder-name-input"]');
      
      // 输入文件夹名称
      await page.fill('[data-testid="folder-name-input"]', 'New Folder');
      
      // 确认创建
      await page.click('[data-testid="confirm-create-folder"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('文件夹创建成功');
      
      // 验证文件夹出现在列表中
      await assertionHelper.assertElementVisible('[data-testid="folder-item"]:has-text("New Folder")');
    });

    test('应该能够进入文件夹', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 假设已有文件夹
      const folderItem = page.locator('[data-testid="folder-item"]').first();
      
      if (await folderItem.count() > 0) {
        // 双击进入文件夹
        await folderItem.dblclick();
        
        // 验证面包屑更新
        await assertionHelper.assertElementVisible('[data-testid="breadcrumb"]');
        
        // 验证文件夹内容显示
        await assertionHelper.assertElementVisible('[data-testid="folder-contents"]');
      }
    });

    test('应该能够返回上级文件夹', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 假设已在子文件夹中
      const backButton = page.locator('[data-testid="back-button"]');
      
      if (await backButton.isVisible()) {
        // 点击返回按钮
        await backButton.click();
        
        // 验证返回到上级文件夹
        await assertionHelper.assertElementVisible('[data-testid="file-manager"]');
      }
    });
  });

  test.describe('存储空间管理', () => {
    test('应该显示存储空间使用情况', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 验证存储空间显示
      await assertionHelper.assertElementVisible('[data-testid="storage-usage"]');
      await assertionHelper.assertElementVisible('[data-testid="storage-bar"]');
      await assertionHelper.assertElementVisible('[data-testid="storage-text"]');
      
      // 验证存储空间数据
      const storageText = await page.textContent('[data-testid="storage-text"]');
      expect(storageText).toMatch(/\d+(\.\d+)?\s*(B|KB|MB|GB)/);
    });

    test('应该在存储空间不足时显示警告', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 模拟存储空间不足
      await page.evaluate(() => {
        window.localStorage.setItem('storage-usage', '95');
      });
      
      await page.reload();
      await waitHelper.waitForLoadingComplete();
      
      // 验证警告显示
      await assertionHelper.assertElementVisible('[data-testid="storage-warning"]');
      await assertionHelper.assertTextContent('[data-testid="storage-warning"]', '存储空间不足');
    });

    test('应该能够清理存储空间', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      // 点击清理按钮
      await page.click('[data-testid="cleanup-button"]');
      
      // 验证清理选项显示
      await assertionHelper.assertElementVisible('[data-testid="cleanup-dialog"]');
      await assertionHelper.assertElementVisible('[data-testid="cleanup-temp-files"]');
      await assertionHelper.assertElementVisible('[data-testid="cleanup-old-files"]');
      
      // 选择清理选项
      await page.check('[data-testid="cleanup-temp-files"]');
      
      // 确认清理
      await page.click('[data-testid="confirm-cleanup"]');
      
      // 验证成功消息
      await formHelper.waitForSuccessMessage('存储空间清理完成');
    });
  });
}); 