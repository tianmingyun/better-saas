/**
 * Mock 策略迁移示例
 * 展示如何从旧的 mock 策略迁移到新的统一 mock 策略
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import {
  setupTestEnvironment,
  setupAuthenticatedUserScenario,
  setupLoadingScenario,
  cleanupTestEnvironment,
  getGlobalMocks,
} from '../utils/mock-setup';
import {
  createMockUser,
  createMockFile,
  createMockFileList,
} from '../utils/mock-factories';

// =============================================================================
// 旧的 Mock 策略示例 (❌ 不推荐)
// =============================================================================

describe('❌ 旧的 Mock 策略 - 问题示例', () => {
  // 问题1: 分散的 mock 定义
  const mockAuthStore = {
    isLoading: false,
    error: null,
    isAuthenticated: false,
    emailLogin: jest.fn(),
    clearError: jest.fn(),
  };

  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  };

  // 问题2: 复杂的模块 mock 设置
  jest.mock('@/store/auth-store', () => ({
    useAuthLoading: () => mockAuthStore.isLoading,
    useAuthError: () => mockAuthStore.error,
    useIsAuthenticated: () => mockAuthStore.isAuthenticated,
    useEmailLogin: () => mockAuthStore.emailLogin,
    useClearError: () => mockAuthStore.clearError,
  }));

  jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    usePathname: () => '/',
  }));

  jest.mock('sonner', () => ({
    toast: mockToast,
  }));

  beforeEach(() => {
    // 问题3: 手动重置每个 mock
    jest.clearAllMocks();
    mockAuthStore.isLoading = false;
    mockAuthStore.error = null;
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.emailLogin.mockReset();
    mockAuthStore.clearError.mockReset();
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();
  });

  it('旧策略的问题：mock 状态管理复杂', () => {
    // 问题4: 需要手动设置每个状态
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.isLoading = false;

    // 问题5: 硬编码的测试数据
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    };

    // 测试逻辑...
    expect(mockAuthStore.isAuthenticated).toBe(true);
  });
});

// =============================================================================
// 新的 Mock 策略示例 (✅ 推荐)
// =============================================================================

describe('✅ 新的 Mock 策略 - 改进示例', () => {
  beforeEach(() => {
    // 优势1: 一行代码完成所有设置
    setupTestEnvironment();
  });

  afterEach(() => {
    // 优势2: 一行代码完成所有清理
    cleanupTestEnvironment();
  });

  describe('基础功能测试', () => {
    it('✅ 简化的认证状态设置', () => {
      // 优势3: 使用预定义场景，一行代码设置复杂状态
      const mocks = setupAuthenticatedUserScenario();
      
      expect(mocks.authStore.isAuthenticated).toBe(true);
      expect(mocks.authStore.user).toBeDefined();
    });

    it('✅ 使用工厂函数创建测试数据', () => {
      // 优势4: 可重用的数据工厂
      const user = createMockUser({
        email: 'custom@example.com',
        role: 'admin',
      });

      const files = createMockFileList(5);

      expect(user.email).toBe('custom@example.com');
      expect(user.role).toBe('admin');
      expect(files).toHaveLength(5);
    });

    it('✅ 统一的 mock 状态管理', () => {
      const mocks = getGlobalMocks();
      
      // 优势5: 类型安全的 mock 配置
      mocks.authStore.emailLogin.mockResolvedValue({ success: true });
      mocks.router.push.mockImplementation((path) => {
        mocks.location.pathname = path;
      });

      // 测试逻辑...
      expect(mocks.authStore.emailLogin).toBeDefined();
      expect(mocks.router.push).toBeDefined();
    });
  });

  describe('场景化测试', () => {
    it('✅ 加载状态场景', () => {
      // 优势6: 预定义的复杂场景
      const mocks = setupLoadingScenario();
      
      expect(mocks.authStore.isLoading).toBe(true);
      expect(mocks.authStore.isInitialized).toBe(false);
    });

    it('✅ 自定义场景配置', () => {
      // 优势7: 灵活的场景配置
      const mocks = setupTestEnvironment({
        authenticated: true,
        locale: 'zh',
        user: createMockUser({ role: 'admin' }),
        includeBrowserAPI: false, // 按需加载
      });

      expect(mocks.authStore.isAuthenticated).toBe(true);
      expect(mocks.authStore.user?.role).toBe('admin');
    });
  });

  describe('Mock 函数测试', () => {
    it('✅ 简化的异步操作测试', async () => {
      const mocks = getGlobalMocks();
      
      // 优势8: 清晰的 mock 配置
      mocks.authStore.emailLogin.mockResolvedValue({
        success: true,
        user: createMockUser(),
      });

      const result = await mocks.authStore.emailLogin('test@example.com', 'password');
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(mocks.authStore.emailLogin).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('✅ 错误场景测试', () => {
      const mocks = getGlobalMocks();
      
      // 优势9: 简化的错误场景设置
      mocks.authStore.emailLogin.mockRejectedValue(new Error('Login failed'));
      mocks.authStore.error = 'Authentication failed';

      expect(mocks.authStore.error).toBe('Authentication failed');
    });
  });
});

// =============================================================================
// 迁移对比总结
// =============================================================================

describe('📊 迁移对比总结', () => {
  it('对比：代码行数减少', () => {
    // 旧策略：需要 50+ 行代码设置基本 mock
    // 新策略：只需要 1-3 行代码

    const mocks = setupAuthenticatedUserScenario();
    expect(mocks).toBeDefined();
  });

  it('对比：类型安全提升', () => {
    // 旧策略：大量 any 类型，容易出错
    // 新策略：完整的类型定义

    const user = createMockUser();
    const file = createMockFile();
    
    // TypeScript 会提供完整的类型检查
    expect(user.email).toBeDefined();
    expect(file.mimeType).toBeDefined();
  });

  it('对比：可维护性提升', () => {
    // 旧策略：每个测试文件都需要重复设置
    // 新策略：统一的工厂函数和配置

    const mocks = setupTestEnvironment({
      authenticated: true,
      locale: 'zh',
    });

    expect(mocks.authStore.isAuthenticated).toBe(true);
  });
});

// =============================================================================
// 实际迁移步骤示例
// =============================================================================

/*
迁移步骤：

1. **分析现有测试**
   - 识别重复的 mock 设置
   - 找出常用的测试场景
   - 记录自定义的 mock 行为

2. **逐步替换**
   ```typescript
   // 步骤1: 替换基础设置
   beforeEach(() => {
     setupTestEnvironment(); // 替换复杂的 mock 设置
   });

   // 步骤2: 使用工厂函数
   const user = createMockUser({ role: 'admin' }); // 替换硬编码数据

   // 步骤3: 使用场景函数
   const mocks = setupAuthenticatedUserScenario(); // 替换手动状态设置
   ```

3. **验证功能**
   - 确保所有测试仍然通过
   - 检查 mock 行为是否正确
   - 验证类型安全性

4. **清理旧代码**
   - 删除旧的 mock 定义
   - 移除重复的设置代码
   - 更新相关文档

优势总结：
✅ 代码量减少 60-80%
✅ 类型安全性提升
✅ 可维护性提升
✅ 测试场景标准化
✅ 错误率降低
✅ 开发效率提升
*/ 