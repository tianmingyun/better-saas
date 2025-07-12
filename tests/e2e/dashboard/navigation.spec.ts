import { test, expect } from '../fixtures/test-setup';
import { TEST_USERS } from '../utils/test-helpers';

test.describe('仪表板导航测试', () => {
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
  });

  test.describe('侧边栏导航', () => {
    test('应该显示完整的侧边栏', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 验证侧边栏主要元素
      await assertionHelper.assertElementVisible('[data-testid="sidebar"]');
      await assertionHelper.assertElementVisible('[data-testid="logo"]');
      await assertionHelper.assertElementVisible('[data-testid="sidebar-toggle"]');
      
      // 验证 Better-SaaS 标题
      await assertionHelper.assertTextContent('[data-testid="app-title"]', 'Better-SaaS');
    });

    test('应该显示管理员菜单项', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 验证管理员菜单项
      await assertionHelper.assertElementVisible('[data-testid="dashboard-menu"]');
      await assertionHelper.assertElementVisible('[data-testid="users-menu-item"]');
      await assertionHelper.assertElementVisible('[data-testid="files-menu-item"]');
      await assertionHelper.assertElementVisible('[data-testid="config-menu-item"]');
      
      // 验证设置菜单项
      await assertionHelper.assertElementVisible('[data-testid="settings-menu"]');
      await assertionHelper.assertElementVisible('[data-testid="profile-menu-item"]');
      await assertionHelper.assertElementVisible('[data-testid="billing-menu-item"]');
      await assertionHelper.assertElementVisible('[data-testid="security-menu-item"]');
    });

    test('应该能够折叠和展开侧边栏', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 验证侧边栏默认展开
      await assertionHelper.assertElementVisible('[data-testid="app-title"]');
      
      // 点击折叠按钮
      await page.click('[data-testid="sidebar-toggle"]');
      
      // 验证侧边栏折叠
      await assertionHelper.assertElementHidden('[data-testid="app-title"]');
      
      // 再次点击展开
      await page.click('[data-testid="sidebar-toggle"]');
      
      // 验证侧边栏展开
      await assertionHelper.assertElementVisible('[data-testid="app-title"]');
    });

    test('侧边栏应该显示当前活跃页面', async ({ 
      page, 
      assertionHelper 
    }) => {
      // 访问用户管理页面
      await page.goto('/dashboard/users');
      
      // 验证用户菜单项高亮
      await expect(page.locator('[data-testid="users-menu-item"]')).toHaveClass(/active|bg-secondary/);
      
      // 访问文件管理页面
      await page.goto('/dashboard/files');
      
      // 验证文件菜单项高亮
      await expect(page.locator('[data-testid="files-menu-item"]')).toHaveClass(/active|bg-secondary/);
      
      // 访问配置页面
      await page.goto('/dashboard/config');
      
      // 验证配置菜单项高亮
      await expect(page.locator('[data-testid="config-menu-item"]')).toHaveClass(/active|bg-secondary/);
    });

    test('应该能够通过侧边栏导航到各个页面', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 点击用户管理
      await page.click('[data-testid="users-menu-item"]');
      await assertionHelper.assertUrl('/dashboard/users');
      await assertionHelper.assertElementVisible('[data-testid="users-table"]');
      
      // 点击文件管理
      await page.click('[data-testid="files-menu-item"]');
      await assertionHelper.assertUrl('/dashboard/files');
      await assertionHelper.assertElementVisible('[data-testid="file-manager"]');
      
      // 点击系统配置
      await page.click('[data-testid="config-menu-item"]');
      await assertionHelper.assertUrl('/dashboard/config');
      await assertionHelper.assertElementVisible('[data-testid="config-content"]');
      
      // 点击个人资料
      await page.click('[data-testid="profile-menu-item"]');
      await assertionHelper.assertUrl('/settings/profile');
      await assertionHelper.assertElementVisible('[data-testid="profile-content"]');
      
      // 点击账单管理
      await page.click('[data-testid="billing-menu-item"]');
      await assertionHelper.assertUrl('/settings/billing');
      await assertionHelper.assertElementVisible('[data-testid="billing-content"]');
      
      // 点击安全设置
      await page.click('[data-testid="security-menu-item"]');
      await assertionHelper.assertUrl('/settings/security');
      await assertionHelper.assertElementVisible('[data-testid="security-content"]');
    });
  });

  test.describe('顶部导航栏', () => {
    test('应该显示完整的顶部导航栏', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 验证顶部导航栏元素
      await assertionHelper.assertElementVisible('[data-testid="dashboard-header"]');
      await assertionHelper.assertElementVisible('[data-testid="theme-toggle"]');
      await assertionHelper.assertElementVisible('[data-testid="user-menu-trigger"]');
    });

    test('应该能够切换主题', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 点击主题切换按钮
      await page.click('[data-testid="theme-toggle"]');
      
      // 验证主题菜单显示
      await assertionHelper.assertElementVisible('[data-testid="theme-menu"]');
      await assertionHelper.assertElementVisible('[data-testid="theme-light"]');
      await assertionHelper.assertElementVisible('[data-testid="theme-dark"]');
      await assertionHelper.assertElementVisible('[data-testid="theme-system"]');
      
      // 选择深色主题
      await page.click('[data-testid="theme-dark"]');
      
      // 验证页面应用深色主题
      await expect(page.locator('html')).toHaveClass(/dark/);
      
      // 选择浅色主题
      await page.click('[data-testid="theme-toggle"]');
      await page.click('[data-testid="theme-light"]');
      
      // 验证页面应用浅色主题
      await expect(page.locator('html')).not.toHaveClass(/dark/);
    });

    test('应该显示用户菜单', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 点击用户菜单
      await page.click('[data-testid="user-menu-trigger"]');
      
      // 验证用户菜单项
      await assertionHelper.assertElementVisible('[data-testid="user-menu"]');
      await assertionHelper.assertElementVisible('[data-testid="user-profile-link"]');
      await assertionHelper.assertElementVisible('[data-testid="user-settings-link"]');
      await assertionHelper.assertElementVisible('[data-testid="logout-button"]');
      
      // 验证用户信息显示
      await assertionHelper.assertTextContent('[data-testid="user-email"]', TEST_USERS.admin.email);
    });

    test('应该能够通过用户菜单退出登录', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 点击用户菜单
      await page.click('[data-testid="user-menu-trigger"]');
      
      // 点击退出登录
      await page.click('[data-testid="logout-button"]');
      
      // 验证重定向到首页
      await assertionHelper.assertUrl('/');
      
      // 验证用户菜单不再显示
      await assertionHelper.assertElementHidden('[data-testid="user-menu-trigger"]');
    });
  });

  test.describe('面包屑导航', () => {
    test('应该显示正确的面包屑路径', async ({ 
      page, 
      assertionHelper 
    }) => {
      // 仪表板首页
      await page.goto('/dashboard');
      await assertionHelper.assertElementVisible('[data-testid="breadcrumb"]');
      await assertionHelper.assertTextContent('[data-testid="breadcrumb"]', '仪表板');
      
      // 用户管理页面
      await page.goto('/dashboard/users');
      await assertionHelper.assertTextContent('[data-testid="breadcrumb"]', '仪表板 / 用户管理');
      
      // 文件管理页面
      await page.goto('/dashboard/files');
      await assertionHelper.assertTextContent('[data-testid="breadcrumb"]', '仪表板 / 文件管理');
      
      // 系统配置页面
      await page.goto('/dashboard/config');
      await assertionHelper.assertTextContent('[data-testid="breadcrumb"]', '仪表板 / 系统配置');
    });

    test('面包屑链接应该可以点击导航', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard/users');
      
      // 点击面包屑中的仪表板链接
      await page.click('[data-testid="breadcrumb-dashboard"]');
      
      // 验证导航到仪表板
      await assertionHelper.assertUrl('/dashboard');
      await assertionHelper.assertElementVisible('[data-testid="dashboard-content"]');
    });
  });

  test.describe('响应式导航', () => {
    test('移动端应该显示汉堡菜单', async ({ 
      page, 
      assertionHelper 
    }) => {
      // 设置移动端视口
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      
      // 验证汉堡菜单显示
      await assertionHelper.assertElementVisible('[data-testid="mobile-menu-trigger"]');
      
      // 验证侧边栏默认隐藏
      await assertionHelper.assertElementHidden('[data-testid="sidebar"]');
      
      // 点击汉堡菜单
      await page.click('[data-testid="mobile-menu-trigger"]');
      
      // 验证侧边栏显示
      await assertionHelper.assertElementVisible('[data-testid="sidebar"]');
    });

    test('平板端应该正常显示导航', async ({ 
      page, 
      assertionHelper 
    }) => {
      // 设置平板端视口
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');
      
      // 验证侧边栏显示
      await assertionHelper.assertElementVisible('[data-testid="sidebar"]');
      
      // 验证顶部导航栏显示
      await assertionHelper.assertElementVisible('[data-testid="dashboard-header"]');
    });

    test('桌面端应该正常显示所有导航元素', async ({ 
      page, 
      assertionHelper 
    }) => {
      // 设置桌面端视口
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/dashboard');
      
      // 验证所有导航元素显示
      await assertionHelper.assertElementVisible('[data-testid="sidebar"]');
      await assertionHelper.assertElementVisible('[data-testid="dashboard-header"]');
      await assertionHelper.assertElementVisible('[data-testid="breadcrumb"]');
      await assertionHelper.assertElementVisible('[data-testid="app-title"]');
    });
  });

  test.describe('快捷键导航', () => {
    test('应该支持键盘快捷键导航', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 使用 Ctrl+1 快捷键导航到用户管理
      await page.keyboard.press('Control+1');
      await assertionHelper.assertUrl('/dashboard/users');
      
      // 使用 Ctrl+2 快捷键导航到文件管理
      await page.keyboard.press('Control+2');
      await assertionHelper.assertUrl('/dashboard/files');
      
      // 使用 Ctrl+3 快捷键导航到系统配置
      await page.keyboard.press('Control+3');
      await assertionHelper.assertUrl('/dashboard/config');
    });

    test('应该支持 ESC 键关闭菜单', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 打开用户菜单
      await page.click('[data-testid="user-menu-trigger"]');
      await assertionHelper.assertElementVisible('[data-testid="user-menu"]');
      
      // 按 ESC 键关闭菜单
      await page.keyboard.press('Escape');
      await assertionHelper.assertElementHidden('[data-testid="user-menu"]');
      
      // 打开主题菜单
      await page.click('[data-testid="theme-toggle"]');
      await assertionHelper.assertElementVisible('[data-testid="theme-menu"]');
      
      // 按 ESC 键关闭菜单
      await page.keyboard.press('Escape');
      await assertionHelper.assertElementHidden('[data-testid="theme-menu"]');
    });
  });

  test.describe('权限控制', () => {
    test('普通用户应该看不到管理员菜单', async ({ 
      page, 
      authHelper, 
      assertionHelper 
    }) => {
      // 退出管理员登录
      await page.goto('/');
      await page.click('[data-testid="user-menu-trigger"]');
      await page.click('[data-testid="logout-button"]');
      
      // 以普通用户身份登录
      await authHelper.loginAsUser();
      
      // 验证重定向到设置页面而不是仪表板
      await assertionHelper.assertUrl(/\/settings/);
      
      // 验证没有管理员菜单
      await assertionHelper.assertElementHidden('[data-testid="dashboard-menu"]');
      
      // 验证只有设置菜单
      await assertionHelper.assertElementVisible('[data-testid="settings-menu"]');
    });

    test('未登录用户访问仪表板应该重定向到登录页面', async ({ 
      page, 
      assertionHelper 
    }) => {
      // 清除登录状态
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // 尝试访问仪表板
      await page.goto('/dashboard');
      
      // 验证重定向到登录页面
      await assertionHelper.assertUrl(/\/login/);
    });
  });

  test.describe('搜索功能', () => {
    test('应该显示全局搜索框', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 验证搜索框显示
      await assertionHelper.assertElementVisible('[data-testid="global-search"]');
      
      // 点击搜索框
      await page.click('[data-testid="global-search"]');
      
      // 验证搜索面板显示
      await assertionHelper.assertElementVisible('[data-testid="search-panel"]');
    });

    test('应该能够搜索菜单项', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 点击搜索框
      await page.click('[data-testid="global-search"]');
      
      // 输入搜索关键词
      await page.fill('[data-testid="search-input"]', '用户');
      
      // 验证搜索结果
      await assertionHelper.assertElementVisible('[data-testid="search-results"]');
      await assertionHelper.assertTextContent('[data-testid="search-results"]', '用户管理');
      
      // 点击搜索结果
      await page.click('[data-testid="search-result-users"]');
      
      // 验证导航到用户管理页面
      await assertionHelper.assertUrl('/dashboard/users');
    });

    test('应该支持键盘快捷键打开搜索', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 使用 Ctrl+K 快捷键打开搜索
      await page.keyboard.press('Control+k');
      
      // 验证搜索面板显示
      await assertionHelper.assertElementVisible('[data-testid="search-panel"]');
      
      // 验证搜索框获得焦点
      await expect(page.locator('[data-testid="search-input"]')).toBeFocused();
    });
  });

  test.describe('通知中心', () => {
    test('应该显示通知铃铛图标', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 验证通知图标显示
      await assertionHelper.assertElementVisible('[data-testid="notification-bell"]');
    });

    test('应该能够查看通知列表', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 点击通知图标
      await page.click('[data-testid="notification-bell"]');
      
      // 验证通知面板显示
      await assertionHelper.assertElementVisible('[data-testid="notification-panel"]');
      await assertionHelper.assertElementVisible('[data-testid="notification-list"]');
    });

    test('应该显示未读通知数量', async ({ 
      page, 
      assertionHelper 
    }) => {
      await page.goto('/dashboard');
      
      // 验证通知数量徽章
      await assertionHelper.assertElementVisible('[data-testid="notification-badge"]');
      
      // 验证数量显示
      const badgeText = await page.textContent('[data-testid="notification-badge"]');
      expect(parseInt(badgeText || '0')).toBeGreaterThanOrEqual(0);
    });
  });
}); 