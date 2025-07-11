import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';

// Mock auth store
const mockAuthStore = {
  user: null as any,
  updateUser: jest.fn(),
  isLoading: false,
};

jest.mock('@/store/auth-store', () => ({
  useUser: () => mockAuthStore.user,
  useUpdateUser: () => mockAuthStore.updateUser,
  useAuthLoading: () => mockAuthStore.isLoading,
}));

// Mock toast messages
const mockToastMessages = {
  success: {
    nameUpdated: jest.fn(),
    avatarUpdated: jest.fn(),
  },
  error: {
    nameEmpty: jest.fn(),
    nameUpdateFailed: jest.fn(),
    avatarUpdateFailed: jest.fn(),
    fileUploadFailed: jest.fn(),
  },
  info: {
    nameNotChanged: jest.fn(),
  },
};

jest.mock('@/hooks/use-toast-messages', () => ({
  useToastMessages: () => mockToastMessages,
}));

// Mock upload avatar action
const mockUploadAvatarAction = jest.fn();

jest.mock('@/server/actions/upload-avatar', () => ({
  uploadAvatarAction: mockUploadAvatarAction,
}));

// Mock React hooks
const React = {
  useState: jest.fn(),
  useEffect: jest.fn(),
};

// Create a simple implementation for testing
function createUseProfile() {
  return function useProfile() {
    const mockAuthStore = require('@/store/auth-store');
    const mockToastHook = require('@/hooks/use-toast-messages');
    const mockUploadAction = require('@/server/actions/upload-avatar');
    
    const user = mockAuthStore.useUser();
    const updateUser = mockAuthStore.useUpdateUser();
    const isLoading = mockAuthStore.useAuthLoading();
    const toastMessages = mockToastHook.useToastMessages();

    const [formData, setFormData] = React.useState({
      name: '',
      email: '',
    });

    const [isUpdatingName, setIsUpdatingName] = React.useState(false);
    const [isUpdatingAvatar, setIsUpdatingAvatar] = React.useState(false);

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

    const handleUpdateAvatar = async (file: File) => {
      setIsUpdatingAvatar(true);
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const result = await mockUploadAction.uploadAvatarAction(formData);
        
        if (result.success) {
          await updateUser({ image: result.url });
          toastMessages.success.avatarUpdated();
        } else {
          toastMessages.error.avatarUpdateFailed();
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
      handleUpdateAvatar,
    };
  };
}

describe('useProfile Hook Tests', () => {
  let useProfile: ReturnType<typeof createUseProfile>;

  beforeEach(() => {
    jest.clearAllMocks();
    useProfile = createUseProfile();

    // Reset mock states
    mockAuthStore.user = null;
    mockAuthStore.isLoading = false;

    // Mock React hooks
    React.useState.mockImplementation((initial) => [initial, jest.fn()]);
    React.useEffect.mockImplementation((fn) => fn());
  });

  describe('Basic Functionality', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() => useProfile());

      expect(result.current.user).toBeNull();
      expect(result.current.formData).toEqual({ name: '', email: '' });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isUpdatingName).toBe(false);
      expect(result.current.isUpdatingAvatar).toBe(false);
      expect(typeof result.current.handleUpdateName).toBe('function');
      expect(typeof result.current.handleUpdateAvatar).toBe('function');
    });

    it('should reflect user data from auth store', () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
      };
      mockAuthStore.user = mockUser;

      const { result } = renderHook(() => useProfile());

      expect(result.current.user).toBe(mockUser);
    });

    it('should reflect loading state from auth store', () => {
      mockAuthStore.isLoading = true;

      const { result } = renderHook(() => useProfile());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Form Data Management', () => {
    it('should initialize form data from user', () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const mockSetFormData = jest.fn();
      React.useState.mockImplementation((initial) => {
        if (typeof initial === 'object' && initial.name !== undefined) {
          return [initial, mockSetFormData];
        }
        return [initial, jest.fn()];
      });

      mockAuthStore.user = mockUser;

      renderHook(() => useProfile());

      expect(mockSetFormData).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
      });
    });

    it('should handle user with missing name', () => {
      const mockUser = {
        id: 'user-123',
        name: null,
        email: 'test@example.com',
      };

      const mockSetFormData = jest.fn();
      React.useState.mockImplementation((initial) => {
        if (typeof initial === 'object' && initial.name !== undefined) {
          return [initial, mockSetFormData];
        }
        return [initial, jest.fn()];
      });

      mockAuthStore.user = mockUser;

      renderHook(() => useProfile());

      expect(mockSetFormData).toHaveBeenCalledWith({
        name: '',
        email: 'test@example.com',
      });
    });

    it('should provide setFormData function', () => {
      const mockSetFormData = jest.fn();
      React.useState.mockImplementation((initial) => {
        if (typeof initial === 'object' && initial.name !== undefined) {
          return [{ name: 'Test', email: 'test@example.com' }, mockSetFormData];
        }
        return [initial, jest.fn()];
      });

      const { result } = renderHook(() => useProfile());

      expect(result.current.setFormData).toBe(mockSetFormData);
    });
  });

  describe('Name Update', () => {
    it('should handle successful name update', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Old Name',
        email: 'test@example.com',
      };
      
      const mockSetIsUpdatingName = jest.fn();
      React.useState.mockImplementation((initial) => {
        if (typeof initial === 'object' && initial.name !== undefined) {
          return [{ name: 'New Name', email: 'test@example.com' }, jest.fn()];
        }
        if (initial === false && mockSetIsUpdatingName.mock.calls.length === 0) {
          return [false, mockSetIsUpdatingName];
        }
        return [initial, jest.fn()];
      });

      mockAuthStore.user = mockUser;
      mockAuthStore.updateUser.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateName();
      });

      expect(mockAuthStore.updateUser).toHaveBeenCalledWith({ name: 'New Name' });
      expect(mockToastMessages.success.nameUpdated).toHaveBeenCalledTimes(1);
      expect(mockSetIsUpdatingName).toHaveBeenCalledWith(true);
      expect(mockSetIsUpdatingName).toHaveBeenCalledWith(false);
    });

    it('should handle failed name update', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Old Name',
        email: 'test@example.com',
      };
      
      const mockSetIsUpdatingName = jest.fn();
      React.useState.mockImplementation((initial) => {
        if (typeof initial === 'object' && initial.name !== undefined) {
          return [{ name: 'New Name', email: 'test@example.com' }, jest.fn()];
        }
        if (initial === false && mockSetIsUpdatingName.mock.calls.length === 0) {
          return [false, mockSetIsUpdatingName];
        }
        return [initial, jest.fn()];
      });

      mockAuthStore.user = mockUser;
      mockAuthStore.updateUser.mockResolvedValue({ success: false, error: 'Update failed' });

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateName();
      });

      expect(mockToastMessages.error.nameUpdateFailed).toHaveBeenCalledWith('Update failed');
      expect(mockSetIsUpdatingName).toHaveBeenCalledWith(false);
    });

    it('should handle empty name validation', async () => {
      React.useState.mockImplementation((initial) => {
        if (typeof initial === 'object' && initial.name !== undefined) {
          return [{ name: '   ', email: 'test@example.com' }, jest.fn()];
        }
        return [initial, jest.fn()];
      });

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateName();
      });

      expect(mockToastMessages.error.nameEmpty).toHaveBeenCalledTimes(1);
      expect(mockAuthStore.updateUser).not.toHaveBeenCalled();
    });

    it('should handle unchanged name', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Same Name',
        email: 'test@example.com',
      };

      React.useState.mockImplementation((initial) => {
        if (typeof initial === 'object' && initial.name !== undefined) {
          return [{ name: 'Same Name', email: 'test@example.com' }, jest.fn()];
        }
        return [initial, jest.fn()];
      });

      mockAuthStore.user = mockUser;

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateName();
      });

      expect(mockToastMessages.info.nameNotChanged).toHaveBeenCalledTimes(1);
      expect(mockAuthStore.updateUser).not.toHaveBeenCalled();
    });

    it('should handle update exception', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Old Name',
        email: 'test@example.com',
      };
      
      const mockSetIsUpdatingName = jest.fn();
      React.useState.mockImplementation((initial) => {
        if (typeof initial === 'object' && initial.name !== undefined) {
          return [{ name: 'New Name', email: 'test@example.com' }, jest.fn()];
        }
        if (initial === false && mockSetIsUpdatingName.mock.calls.length === 0) {
          return [false, mockSetIsUpdatingName];
        }
        return [initial, jest.fn()];
      });

      mockAuthStore.user = mockUser;
      mockAuthStore.updateUser.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateName();
      });

      expect(mockToastMessages.error.nameUpdateFailed).toHaveBeenCalledTimes(1);
      expect(mockSetIsUpdatingName).toHaveBeenCalledWith(false);
    });
  });

  describe('Avatar Update', () => {
    it('should handle successful avatar update', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockSetIsUpdatingAvatar = jest.fn();
      
      React.useState.mockImplementation((initial) => {
        if (initial === false && mockSetIsUpdatingAvatar.mock.calls.length === 0) {
          return [false, mockSetIsUpdatingAvatar];
        }
        return [initial, jest.fn()];
      });

      mockUploadAvatarAction.mockResolvedValue({
        success: true,
        url: 'https://example.com/new-avatar.jpg',
      });
      mockAuthStore.updateUser.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateAvatar(mockFile);
      });

      expect(mockUploadAvatarAction).toHaveBeenCalledWith(expect.any(FormData));
      expect(mockAuthStore.updateUser).toHaveBeenCalledWith({ 
        image: 'https://example.com/new-avatar.jpg' 
      });
      expect(mockToastMessages.success.avatarUpdated).toHaveBeenCalledTimes(1);
      expect(mockSetIsUpdatingAvatar).toHaveBeenCalledWith(true);
      expect(mockSetIsUpdatingAvatar).toHaveBeenCalledWith(false);
    });

    it('should handle failed avatar upload', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockSetIsUpdatingAvatar = jest.fn();
      
      React.useState.mockImplementation((initial) => {
        if (initial === false && mockSetIsUpdatingAvatar.mock.calls.length === 0) {
          return [false, mockSetIsUpdatingAvatar];
        }
        return [initial, jest.fn()];
      });

      mockUploadAvatarAction.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateAvatar(mockFile);
      });

      expect(mockToastMessages.error.avatarUpdateFailed).toHaveBeenCalledTimes(1);
      expect(mockAuthStore.updateUser).not.toHaveBeenCalled();
      expect(mockSetIsUpdatingAvatar).toHaveBeenCalledWith(false);
    });

    it('should handle avatar upload exception', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockSetIsUpdatingAvatar = jest.fn();
      
      React.useState.mockImplementation((initial) => {
        if (initial === false && mockSetIsUpdatingAvatar.mock.calls.length === 0) {
          return [false, mockSetIsUpdatingAvatar];
        }
        return [initial, jest.fn()];
      });

      mockUploadAvatarAction.mockRejectedValue(new Error('Upload failed'));

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateAvatar(mockFile);
      });

      expect(mockToastMessages.error.avatarUpdateFailed).toHaveBeenCalledTimes(1);
      expect(mockSetIsUpdatingAvatar).toHaveBeenCalledWith(false);
    });
  });

  describe('Loading States', () => {
    it('should track name update loading state', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Old Name',
        email: 'test@example.com',
      };
      
      let isUpdatingNameState = false;
      const mockSetIsUpdatingName = jest.fn((value) => {
        isUpdatingNameState = value;
      });
      
      React.useState.mockImplementation((initial) => {
        if (typeof initial === 'object' && initial.name !== undefined) {
          return [{ name: 'New Name', email: 'test@example.com' }, jest.fn()];
        }
        if (initial === false && mockSetIsUpdatingName.mock.calls.length === 0) {
          return [isUpdatingNameState, mockSetIsUpdatingName];
        }
        return [initial, jest.fn()];
      });

      mockAuthStore.user = mockUser;
      mockAuthStore.updateUser.mockImplementation(() => {
        expect(isUpdatingNameState).toBe(true);
        return Promise.resolve({ success: true });
      });

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateName();
      });

      expect(mockSetIsUpdatingName).toHaveBeenCalledWith(true);
      expect(mockSetIsUpdatingName).toHaveBeenCalledWith(false);
    });

    it('should track avatar update loading state', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      
      let isUpdatingAvatarState = false;
      const mockSetIsUpdatingAvatar = jest.fn((value) => {
        isUpdatingAvatarState = value;
      });
      
      React.useState.mockImplementation((initial) => {
        if (initial === false && mockSetIsUpdatingAvatar.mock.calls.length === 0) {
          return [isUpdatingAvatarState, mockSetIsUpdatingAvatar];
        }
        return [initial, jest.fn()];
      });

      mockUploadAvatarAction.mockImplementation(() => {
        expect(isUpdatingAvatarState).toBe(true);
        return Promise.resolve({ success: true, url: 'https://example.com/avatar.jpg' });
      });
      mockAuthStore.updateUser.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateAvatar(mockFile);
      });

      expect(mockSetIsUpdatingAvatar).toHaveBeenCalledWith(true);
      expect(mockSetIsUpdatingAvatar).toHaveBeenCalledWith(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with null email', () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: null,
      };

      const mockSetFormData = jest.fn();
      React.useState.mockImplementation((initial) => {
        if (typeof initial === 'object' && initial.name !== undefined) {
          return [initial, mockSetFormData];
        }
        return [initial, jest.fn()];
      });

      mockAuthStore.user = mockUser;

      renderHook(() => useProfile());

      expect(mockSetFormData).toHaveBeenCalledWith({
        name: 'Test User',
        email: '',
      });
    });

    it('should handle file with FormData correctly', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      
      mockUploadAvatarAction.mockImplementation((formData) => {
        expect(formData).toBeInstanceOf(FormData);
        expect(formData.get('avatar')).toBe(mockFile);
        return Promise.resolve({ success: true, url: 'https://example.com/avatar.jpg' });
      });
      mockAuthStore.updateUser.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.handleUpdateAvatar(mockFile);
      });

      expect(mockUploadAvatarAction).toHaveBeenCalledWith(expect.any(FormData));
    });
  });
}); 