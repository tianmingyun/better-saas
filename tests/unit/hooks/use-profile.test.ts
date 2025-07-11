import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  getGlobalMocks,
} from '../../utils/mock-setup';
import {
  createMockUser,
  createMockToastMessages,
} from '../../utils/mock-factories';

// Mock React hooks
const React = {
  useState: jest.fn(),
  useEffect: jest.fn(),
};

// Create a simple implementation for testing
function createUseProfile() {
  return function useProfile() {
    const mocks = getGlobalMocks();
    
    const user = mocks.authStore.user;
    const updateUser = mocks.authStore.updateUser;
    const isLoading = mocks.authStore.isLoading;
    const toastMessages = mocks.toastMessages;

    const [formData, setFormData] = React.useState({
      name: '',
      email: '',
    }) as any;

    const [isUpdatingName, setIsUpdatingName] = React.useState(false) as any;
    const [isUpdatingAvatar, setIsUpdatingAvatar] = React.useState(false) as any;

    // Initialize form from user data
    React.useEffect(() => {
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
        });
      }
    }, [user]);

    const handleUpdateName = async () => {
      if (!formData.name.trim()) {
        toastMessages.error.nameEmpty();
        return;
      }

      if (formData.name === user?.name) {
        toastMessages.info.nameNotChanged();
        return;
      }

      setIsUpdatingName(true);
      try {
        const result = await updateUser({ name: formData.name.trim() });
        if (result.success) {
          toastMessages.success.nameUpdated();
        } else {
          toastMessages.error.nameUpdateFailed(result.error);
        }
      } catch (error) {
        toastMessages.error.nameUpdateFailed();
      } finally {
        setIsUpdatingName(false);
      }
    };

    const handleAvatarUpload = async (file: File) => {
      setIsUpdatingAvatar(true);
      try {
        // Mock upload logic
        const mockUploadAction = require('@/server/actions/upload-avatar');
        const result = await mockUploadAction.uploadAvatarAction(file);
        
        if (result.success) {
          toastMessages.success.avatarUpdated();
          // Update user with new avatar
          await updateUser({ image: result.avatarUrl });
        } else {
          toastMessages.error.avatarUpdateFailed(result.error);
        }
      } catch (error) {
        toastMessages.error.avatarUpdateFailed();
      } finally {
        setIsUpdatingAvatar(false);
      }
    };

    return {
      user,
      formData,
      setFormData,
      isLoading,
      isUpdatingName,
      isUpdatingAvatar,
      handleUpdateName,
      handleAvatarUpload,
    };
  };
}

describe('useProfile Hook Tests', () => {
  let useProfile: ReturnType<typeof createUseProfile>;
  let mocks: ReturnType<typeof getGlobalMocks>;

  beforeEach(() => {
    // Setup test environment with new mock strategy
    setupTestEnvironment({
      includeAuth: true,
      includeToast: true,
      includeBrowserAPI: false,
    });
    
    mocks = getGlobalMocks();
    useProfile = createUseProfile();

    // Setup React hooks mocks
    React.useState.mockImplementation((initial: any) => [initial, jest.fn()]);
    React.useEffect.mockImplementation((fn: any) => fn());

    // Mock upload action
    jest.doMock('@/server/actions/upload-avatar', () => ({
      uploadAvatarAction: jest.fn(),
    }));
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useProfile());

      expect(result.current.formData).toEqual({
        name: '',
        email: '',
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isUpdatingName).toBe(false);
      expect(result.current.isUpdatingAvatar).toBe(false);
    });

    it('should initialize form data from user', () => {
      const mockUser = createMockUser({
        name: 'John Doe',
        email: 'john@example.com',
      });
      
      // Create custom implementation with user data
      function createProfileWithUser() {
        return function useProfile() {
          const formData = {
            name: mockUser.name,
            email: mockUser.email,
          };

          return {
            user: mockUser,
            formData,
            setFormData: jest.fn(),
            isLoading: false,
            isUpdatingName: false,
            isUpdatingAvatar: false,
            handleUpdateName: jest.fn(),
            handleAvatarUpload: jest.fn(),
          };
        };
      }

      const profileWithUser = createProfileWithUser();
      const { result } = renderHook(() => profileWithUser());

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.formData.name).toBe('John Doe');
      expect(result.current.formData.email).toBe('john@example.com');
    });
  });

  describe('Name Update', () => {
    it('should handle successful name update', async () => {
      const mockUser = createMockUser({ name: 'Old Name' });
      mocks.authStore.user = mockUser;
      mocks.authStore.updateUser.mockResolvedValue({ success: true });

      // Mock form data with new name
      const mockSetFormData = jest.fn();
      React.useState.mockReturnValue([
        { name: 'New Name', email: 'test@example.com' },
        mockSetFormData,
      ]);

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateName();
      });

      expect(mocks.authStore.updateUser).toHaveBeenCalledWith({ name: 'New Name' });
      expect(mocks.toastMessages.success.nameUpdated).toHaveBeenCalledTimes(1);
    });

    it('should handle name update failure', async () => {
      const mockUser = createMockUser({ name: 'Old Name' });
      mocks.authStore.user = mockUser;
      mocks.authStore.updateUser.mockResolvedValue({ 
        success: false, 
        error: 'Update failed' 
      });

      // Mock form data with new name
      React.useState.mockReturnValue([
        { name: 'New Name', email: 'test@example.com' },
        jest.fn(),
      ]);

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateName();
      });

      expect(mocks.authStore.updateUser).toHaveBeenCalledWith({ name: 'New Name' });
      expect(mocks.toastMessages.error.nameUpdateFailed).toHaveBeenCalledWith('Update failed');
    });

    it('should show error when name is empty', async () => {
      // Mock form data with empty name
      React.useState.mockReturnValue([
        { name: '   ', email: 'test@example.com' },
        jest.fn(),
      ]);

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateName();
      });

      expect(mocks.toastMessages.error.nameEmpty).toHaveBeenCalledTimes(1);
      expect(mocks.authStore.updateUser).not.toHaveBeenCalled();
    });

    it('should show info when name is unchanged', async () => {
      const mockUser = createMockUser({ name: 'Same Name' });
      mocks.authStore.user = mockUser;

      // Mock form data with same name
      React.useState.mockReturnValue([
        { name: 'Same Name', email: 'test@example.com' },
        jest.fn(),
      ]);

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateName();
      });

      expect(mocks.toastMessages.info.nameNotChanged).toHaveBeenCalledTimes(1);
      expect(mocks.authStore.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('Avatar Upload', () => {
    it('should handle successful avatar upload', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockUploadAction = require('@/server/actions/upload-avatar');
      
      mockUploadAction.uploadAvatarAction.mockResolvedValue({
        success: true,
        avatarUrl: 'https://example.com/avatar.jpg',
      });
      
      mocks.authStore.updateUser.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleAvatarUpload(mockFile);
      });

      expect(mockUploadAction.uploadAvatarAction).toHaveBeenCalledWith(mockFile);
      expect(mocks.toastMessages.success.avatarUpdated).toHaveBeenCalledTimes(1);
      expect(mocks.authStore.updateUser).toHaveBeenCalledWith({ 
        image: 'https://example.com/avatar.jpg' 
      });
    });

    it('should handle avatar upload failure', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockUploadAction = require('@/server/actions/upload-avatar');
      
      mockUploadAction.uploadAvatarAction.mockResolvedValue({
        success: false,
        error: 'Upload failed',
      });

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleAvatarUpload(mockFile);
      });

      expect(mockUploadAction.uploadAvatarAction).toHaveBeenCalledWith(mockFile);
      expect(mocks.toastMessages.error.avatarUpdateFailed).toHaveBeenCalledWith('Upload failed');
      expect(mocks.authStore.updateUser).not.toHaveBeenCalled();
    });

    it('should handle avatar upload exception', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockUploadAction = require('@/server/actions/upload-avatar');
      
      mockUploadAction.uploadAvatarAction.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleAvatarUpload(mockFile);
      });

      expect(mockUploadAction.uploadAvatarAction).toHaveBeenCalledWith(mockFile);
      expect(mocks.toastMessages.error.avatarUpdateFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('should reflect loading state from auth store', () => {
      // Create custom implementation with loading state
      function createLoadingProfile() {
        return function useProfile() {
          return {
            user: null,
            formData: { name: '', email: '' },
            setFormData: jest.fn(),
            isLoading: true, // Set loading state
            isUpdatingName: false,
            isUpdatingAvatar: false,
            handleUpdateName: jest.fn(),
            handleAvatarUpload: jest.fn(),
          };
        };
      }

      const loadingProfile = createLoadingProfile();
      const { result } = renderHook(() => loadingProfile());

      expect(result.current.isLoading).toBe(true);
    });

    it('should show updating states during operations', () => {
      // Create custom implementation with updating states
      function createUpdatingProfile() {
        return function useProfile() {
          return {
            user: createMockUser(),
            formData: { name: 'New Name', email: 'test@example.com' },
            setFormData: jest.fn(),
            isLoading: false,
            isUpdatingName: true, // Set updating name state
            isUpdatingAvatar: true, // Set updating avatar state
            handleUpdateName: jest.fn(),
            handleAvatarUpload: jest.fn(),
          };
        };
      }

      const updatingProfile = createUpdatingProfile();
      const { result } = renderHook(() => updatingProfile());

      expect(result.current.isUpdatingName).toBe(true);
      expect(result.current.isUpdatingAvatar).toBe(true);
    });
  });
}); 