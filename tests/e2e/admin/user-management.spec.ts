import { test, expect } from '../fixtures/test-setup';
import { TEST_USERS } from '../utils/test-helpers';

test.describe('user management test', () => {
  test.beforeEach(async ({ page, authHelper }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await authHelper.loginAsAdmin();
    
    await page.goto('/dashboard/users');
  });

  test.describe('user list display', () => {
    test('should display user list table', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="users-table-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="users-table-body"]')).toBeVisible();

      await expect(page.locator('[data-testid="header-user"]')).toContainText('用户');
      await expect(page.locator('[data-testid="header-email"]')).toContainText('邮箱');
      await expect(page.locator('[data-testid="header-role"]')).toContainText('角色');
      await expect(page.locator('[data-testid="header-status"]')).toContainText('状态');
      await expect(page.locator('[data-testid="header-created"]')).toContainText('注册时间');
    });

    test('should display user stats', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await expect(page.locator('[data-testid="stats-total-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="stats-active-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="stats-new-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="stats-admin-users"]')).toBeVisible();
      
      const totalUsers = await page.textContent('[data-testid="stats-total-users"] .text-2xl');
      const activeUsers = await page.textContent('[data-testid="stats-active-users"] .text-2xl');
      
      expect(parseInt(totalUsers || '0')).toBeGreaterThanOrEqual(0);
      expect(parseInt(activeUsers || '0')).toBeGreaterThanOrEqual(0);
    });

    test('should display user basic info', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await expect(page.locator('[data-testid="user-row"]')).toBeVisible();
      
      const userRow = page.locator('[data-testid="user-row"]').first();
      await expect(userRow.locator('[data-testid="user-avatar"]')).toBeVisible();
      await expect(userRow.locator('[data-testid="user-name"]')).toBeVisible();
      await expect(userRow.locator('[data-testid="user-email"]')).toBeVisible();
      await expect(userRow.locator('[data-testid="user-role"]')).toBeVisible();
      await expect(userRow.locator('[data-testid="user-status"]')).toBeVisible();
    });

    test('should display user role', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      const adminRows = page.locator('[data-testid="user-row"]').filter({ 
        has: page.locator('[data-testid="user-role"]:has-text("管理员")') 
      });
      
      if (await adminRows.count() > 0) {
        const adminRow = adminRows.first();
        
        await expect(adminRow.locator('[data-testid="admin-badge"]')).toBeVisible();
        await expect(adminRow.locator('[data-testid="user-role"]')).toContainText('管理员');
      }
      
      const userRows = page.locator('[data-testid="user-row"]').filter({ 
        has: page.locator('[data-testid="user-role"]:has-text("用户")') 
      });
      
      if (await userRows.count() > 0) {
        const userRow = userRows.first();
        
        await expect(userRow.locator('[data-testid="user-badge"]')).toBeVisible();
        await expect(userRow.locator('[data-testid="user-role"]')).toContainText('用户');
      }
    });

      test('should display email verified status', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      const userRows = page.locator('[data-testid="user-row"]');
      const firstRow = userRows.first();
      
      await expect(firstRow.locator('[data-testid="email-verified"]')).toBeVisible();
      
      const verifiedIcon = firstRow.locator('[data-testid="email-verified"] svg');
      await expect(verifiedIcon).toBeVisible();
    });
  });

  test.describe('search and filter', () => {
    test('should be able to search user', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await expect(page.locator('[data-testid="user-search"]')).toBeVisible();
      
      await page.fill('[data-testid="user-search"]', 'admin');
      
      await waitHelper.waitForApiResponse('**/api/users**');
      
      const searchResults = page.locator('[data-testid="user-row"]');
      const count = await searchResults.count();
      
      if (count > 0) {
        const firstResult = searchResults.first();
        const userEmail = await firstResult.locator('[data-testid="user-email"]').textContent();
        const userName = await firstResult.locator('[data-testid="user-name"]').textContent();
        
        expect(userEmail?.toLowerCase().includes('admin') || userName?.toLowerCase().includes('admin')).toBe(true);
      }
    });

    test('should be able to clear search', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await page.fill('[data-testid="user-search"]', 'admin');
      await waitHelper.waitForApiResponse('**/api/users**');
      
      const searchCount = await page.locator('[data-testid="user-row"]').count();
      
      await page.fill('[data-testid="user-search"]', '');
      await waitHelper.waitForApiResponse('**/api/users**');
      
      const allCount = await page.locator('[data-testid="user-row"]').count();
      expect(allCount).toBeGreaterThanOrEqual(searchCount);
    });

    test('should be able to filter by role', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await expect(page.locator('[data-testid="role-filter"]')).toBeVisible();
      
      await page.click('[data-testid="role-filter"]');
      await page.click('[data-testid="filter-admin"]');
      
      await waitHelper.waitForApiResponse('**/api/users**');
      
      const userRows = page.locator('[data-testid="user-row"]');
      const count = await userRows.count();
      
      for (let i = 0; i < count; i++) {
        const row = userRows.nth(i);
        await expect(row.locator('[data-testid="user-role"]')).toContainText('管理员');
      }
    });

    test('should be able to filter by status', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await expect(page.locator('[data-testid="status-filter"]')).toBeVisible();
      
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="filter-verified"]');
      
      await waitHelper.waitForApiResponse('**/api/users**');
      
      const userRows = page.locator('[data-testid="user-row"]');
      const count = await userRows.count();
      
      for (let i = 0; i < count; i++) {
        const row = userRows.nth(i);
        const verifiedElement = row.locator('[data-testid="email-verified"]');
        await expect(verifiedElement).toContainText('已验证');
      }
    });

    test('should be able to filter by multiple conditions', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await page.fill('[data-testid="user-search"]', 'test');
      
      await page.click('[data-testid="role-filter"]');
      await page.click('[data-testid="filter-user"]');
      
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="filter-verified"]');
      
      await waitHelper.waitForApiResponse('**/api/users**');
      
      const userRows = page.locator('[data-testid="user-row"]');
      const count = await userRows.count();
      
      for (let i = 0; i < count; i++) {
        const row = userRows.nth(i);
        const userEmail = await row.locator('[data-testid="user-email"]').textContent();
        const userName = await row.locator('[data-testid="user-name"]').textContent();
        const userRole = await row.locator('[data-testid="user-role"]').textContent();
        const userStatus = await row.locator('[data-testid="email-verified"]').textContent();
        
        expect(userEmail?.toLowerCase().includes('test') || userName?.toLowerCase().includes('test')).toBe(true);
        
        expect(userRole).toBe('用户');
        
        expect(userStatus).toBe('已验证');
      }
    });
  });

  test.describe('sorting', () => {
    test('should be able to sort by email', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await page.click('[data-testid="header-email"]');
      await waitHelper.waitForApiResponse('**/api/users**');
      
      await expect(page.locator('[data-testid="sort-indicator"]')).toBeVisible();
      
      const emailElements = page.locator('[data-testid="user-email"]');
      const emails = await emailElements.allTextContents();
      
      const sortedEmails = [...emails].sort();
      expect(emails).toEqual(sortedEmails);
    });

    test('should be able to sort by created at', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await page.click('[data-testid="header-created"]');
      await waitHelper.waitForApiResponse('**/api/users**');
      
      await expect(page.locator('[data-testid="sort-indicator"]')).toBeVisible();
      
      await page.click('[data-testid="header-created"]');
      await waitHelper.waitForApiResponse('**/api/users**');
      
      const sortIndicator = page.locator('[data-testid="sort-indicator"]');
      await expect(sortIndicator).toBeVisible();
    });

    test('should be able to reset sorting', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await page.click('[data-testid="header-email"]');
      await waitHelper.waitForApiResponse('**/api/users**');
      
      await expect(page.locator('[data-testid="sort-indicator"]')).toBeVisible();
      
      await page.click('[data-testid="header-created"]');
      await waitHelper.waitForApiResponse('**/api/users**');
      
      const emailSortIndicator = page.locator('[data-testid="header-email"] [data-testid="sort-indicator"]');
      const createdSortIndicator = page.locator('[data-testid="header-created"] [data-testid="sort-indicator"]');
      
      await expect(emailSortIndicator).toBeHidden();
      await expect(createdSortIndicator).toBeVisible();
    });
  });

  test.describe('pagination', () => {
    test('should display pagination', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
      await expect(page.locator('[data-testid="page-size-selector"]')).toBeVisible();
      await expect(page.locator('[data-testid="page-info"]')).toBeVisible();
    });

    test('should be able to switch page size', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      const currentCount = await page.locator('[data-testid="user-row"]').count();
      
      await page.click('[data-testid="page-size-selector"]');
      await page.click('[data-testid="page-size-5"]');
      
      await waitHelper.waitForApiResponse('**/api/users**');
      
      const newCount = await page.locator('[data-testid="user-row"]').count();
      expect(newCount).toBeLessThanOrEqual(5);
      
      const pageInfo = await page.textContent('[data-testid="page-info"]');
      expect(pageInfo).toContain('5');
    });

    test('should be able to navigate to next page', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await page.click('[data-testid="page-size-selector"]');
      await page.click('[data-testid="page-size-5"]');
      await waitHelper.waitForApiResponse('**/api/users**');
      
      const nextButton = page.locator('[data-testid="next-page"]');
      if (await nextButton.isEnabled()) {
        const firstUserEmail = await page.locator('[data-testid="user-email"]').first().textContent();
        
        await nextButton.click();
        await waitHelper.waitForApiResponse('**/api/users**');
        
        const newFirstUserEmail = await page.locator('[data-testid="user-email"]').first().textContent();
        expect(newFirstUserEmail).not.toBe(firstUserEmail);
        
        const pageInfo = await page.textContent('[data-testid="page-info"]');
        expect(pageInfo).toContain('2');
      }
    });

    test('should be able to navigate to previous page', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await page.click('[data-testid="page-size-selector"]');
      await page.click('[data-testid="page-size-5"]');
      await waitHelper.waitForApiResponse('**/api/users**');
      
      const nextButton = page.locator('[data-testid="next-page"]');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await waitHelper.waitForApiResponse('**/api/users**');
        
        const prevButton = page.locator('[data-testid="prev-page"]');
        expect(await prevButton.isEnabled()).toBe(true);
        
        await prevButton.click();
        await waitHelper.waitForApiResponse('**/api/users**');
        
        const pageInfo = await page.textContent('[data-testid="page-info"]');
        expect(pageInfo).toContain('1');
      }
    });
  });

  test.describe('user actions', () => {
    test('should be able to view user details', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await page.click('[data-testid="user-row"]');
      
      await expect(page.locator('[data-testid="user-details-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-details-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-details-actions"]')).toBeVisible();
    });

    test('should be able to edit user info', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await page.click('[data-testid="user-row"] [data-testid="edit-user-button"]');
      
      await expect(page.locator('[data-testid="edit-user-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="edit-user-form"]')).toBeVisible();
      
      await page.fill('[data-testid="edit-user-name"]', 'Updated Name');
      
      await page.click('[data-testid="save-user-button"]');
      
      await formHelper.waitForSuccessMessage('用户信息已更新');
      
      await expect(page.locator('[data-testid="edit-user-dialog"]')).toBeHidden();
    });

    test('should be able to disable user account', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      const userRow = page.locator('[data-testid="user-row"]').filter({ 
        has: page.locator('[data-testid="user-role"]:has-text("用户")') 
      }).first();
      
      await userRow.locator('[data-testid="disable-user-button"]').click();
      
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-dialog-title"]')).toContainText('禁用用户');
      
      await page.click('[data-testid="confirm-button"]');
      
      await formHelper.waitForSuccessMessage('用户已禁用');
      
      await expect(userRow.locator('[data-testid="user-status"]')).toContainText('已禁用');
    });

    test('should be able to enable user account', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      const userRow = page.locator('[data-testid="user-row"]').filter({ 
        has: page.locator('[data-testid="user-role"]:has-text("用户")') 
      }).first();
      
      await userRow.locator('[data-testid="disable-user-button"]').click();
      await page.click('[data-testid="confirm-button"]');
      await formHelper.waitForSuccessMessage('用户已禁用');
      
      await userRow.locator('[data-testid="enable-user-button"]').click();
      
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-dialog-title"]')).toContainText('启用用户');
      
      await page.click('[data-testid="confirm-button"]');
      
      await formHelper.waitForSuccessMessage('用户已启用');
      
      await expect(userRow.locator('[data-testid="user-status"]')).toContainText('已验证');
    });

    test('should be able to reset user password', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      const userRow = page.locator('[data-testid="user-row"]').first();
      await userRow.locator('[data-testid="reset-password-button"]').click();
      
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-dialog-title"]')).toContainText('重置密码');
      
      await page.click('[data-testid="confirm-button"]');
      
      await formHelper.waitForSuccessMessage('密码重置邮件已发送');
    });

    test('should be able to delete user', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      const initialCount = await page.locator('[data-testid="user-row"]').count();
      
      const userRow = page.locator('[data-testid="user-row"]').filter({ 
        has: page.locator('[data-testid="user-role"]:has-text("用户")') 
      }).first();
      
      await userRow.locator('[data-testid="delete-user-button"]').click();
      
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-dialog-title"]')).toContainText('删除用户');
      
      await page.fill('[data-testid="confirm-input"]', '删除');
      
      await page.click('[data-testid="confirm-button"]');
      
      await formHelper.waitForSuccessMessage('用户已删除');
      
      const finalCount = await page.locator('[data-testid="user-row"]').count();
      expect(finalCount).toBe(initialCount - 1);
    });
  });

  test.describe('bulk actions', () => {
    test('should be able to select multiple users', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await page.click('[data-testid="user-row"] [data-testid="user-checkbox"]');
      
      await expect(page.locator('[data-testid="user-row"] [data-testid="user-checkbox"]').first()).toBeChecked();
      
      await expect(page.locator('[data-testid="bulk-actions-bar"]')).toBeVisible();
      await expect(page.locator('[data-testid="selected-count"]')).toContainText('1');
      
      await page.click('[data-testid="user-row"] [data-testid="user-checkbox"]');
      
      await expect(page.locator('[data-testid="selected-count"]')).toContainText('2');
    });

    test('should be able to select all users', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      await page.click('[data-testid="select-all-checkbox"]');
      
      const userCheckboxes = page.locator('[data-testid="user-checkbox"]');
      const count = await userCheckboxes.count();
      
      for (let i = 0; i < count; i++) {
        await expect(userCheckboxes.nth(i)).toBeChecked();
      }
      
      await expect(page.locator('[data-testid="selected-count"]')).toContainText(count.toString());
    });

    test('should be able to bulk disable users', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      const userRows = page.locator('[data-testid="user-row"]').filter({ 
        has: page.locator('[data-testid="user-role"]:has-text("用户")') 
      });
      
      await userRows.first().locator('[data-testid="user-checkbox"]').click();
      await userRows.nth(1).locator('[data-testid="user-checkbox"]').click();
      
      await page.click('[data-testid="bulk-disable-button"]');
      
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-dialog-title"]')).toContainText('批量禁用用户');
      
      await page.click('[data-testid="confirm-button"]');
      
      await formHelper.waitForSuccessMessage('用户已批量禁用');
      
      await expect(page.locator('[data-testid="bulk-actions-bar"]')).toBeHidden();
    });

    test('should be able to bulk delete users', async ({ 
      page, 
      formHelper, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      const initialCount = await page.locator('[data-testid="user-row"]').count();
      
      const userRows = page.locator('[data-testid="user-row"]').filter({ 
        has: page.locator('[data-testid="user-role"]:has-text("用户")') 
      });
      
      await userRows.first().locator('[data-testid="user-checkbox"]').click();
      await userRows.nth(1).locator('[data-testid="user-checkbox"]').click();
      
      await page.click('[data-testid="bulk-delete-button"]');
      
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-dialog-title"]')).toContainText('批量删除用户');
      
      await page.fill('[data-testid="confirm-input"]', '删除');
      
      await page.click('[data-testid="confirm-button"]');
      
      await formHelper.waitForSuccessMessage('用户已批量删除');
      
      const finalCount = await page.locator('[data-testid="user-row"]').count();
      expect(finalCount).toBe(initialCount - 2);
    });
  });

  test.describe('permission control', () => {
    test('admin should not be able to delete themselves', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      const adminRow = page.locator('[data-testid="user-row"]').filter({ 
        has: page.locator('[data-testid="user-email"]:has-text("' + TEST_USERS.admin.email + '")') 
      });
      
      const deleteButton = adminRow.locator('[data-testid="delete-user-button"]');
      
      if (await deleteButton.count() > 0) {
        expect(await deleteButton.isEnabled()).toBe(false);
      }
    });

    test('should protect system admin account', async ({ 
      page, 
      assertionHelper, 
      waitHelper 
    }) => {
      await waitHelper.waitForLoadingComplete();
      
      const adminRow = page.locator('[data-testid="user-row"]').filter({ 
        has: page.locator('[data-testid="user-role"]:has-text("管理员")') 
      }).first();
      
      await expect(adminRow.locator('[data-testid="system-admin-badge"]')).toBeVisible();
      
      const disableButton = adminRow.locator('[data-testid="disable-user-button"]');
      const deleteButton = adminRow.locator('[data-testid="delete-user-button"]');
      
      if (await disableButton.count() > 0) {
        expect(await disableButton.isEnabled()).toBe(false);
      }
      
      if (await deleteButton.count() > 0) {
        expect(await deleteButton.isEnabled()).toBe(false);
      }
    });
  });
}); 