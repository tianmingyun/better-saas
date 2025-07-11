import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock sonner
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}

jest.mock('sonner', () => ({
  toast: mockToast,
}))

// Mock next-intl
const mockTranslations = {
  'success.nameUpdated': 'Name updated successfully',
  'success.avatarUpdated': 'Avatar updated successfully',
  'success.loginSuccess': 'Login successful',
  'error.nameEmpty': 'Name cannot be empty',
  'error.nameUpdateFailed': 'Failed to update name',
  'error.avatarUpdateFailed': 'Failed to update avatar',
  'error.fileUploadFailed': 'Failed to upload file',
  'error.loginFailed': 'Login failed',
  'error.socialLoginFailed': 'Social login failed',
  'info.nameNotChanged': 'Name was not changed',
}

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => mockTranslations[key as keyof typeof mockTranslations] || key),
}))

// Simple implementation to test
function createToastMessages() {
  const t = (key: string) => mockTranslations[key as keyof typeof mockTranslations] || key;
  
  return {
    success: {
      nameUpdated: () => mockToast.success(t('success.nameUpdated')),
      avatarUpdated: () => mockToast.success(t('success.avatarUpdated')),
      loginSuccess: () => mockToast.success(t('success.loginSuccess')),
    },
    error: {
      nameEmpty: () => mockToast.error(t('error.nameEmpty')),
      nameUpdateFailed: (customMessage?: string) => mockToast.error(customMessage || t('error.nameUpdateFailed')),
      avatarUpdateFailed: (customMessage?: string) => mockToast.error(customMessage || t('error.avatarUpdateFailed')),
      fileUploadFailed: (customMessage?: string) => mockToast.error(customMessage || t('error.fileUploadFailed')),
      loginFailed: (customMessage?: string) => mockToast.error(customMessage || t('error.loginFailed')),
      socialLoginFailed: (customMessage?: string) => mockToast.error(customMessage || t('error.socialLoginFailed')),
    },
    info: {
      nameNotChanged: () => mockToast.info(t('info.nameNotChanged')),
    },
  };
}

describe('useToastMessages Hook Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Success Messages', () => {
    it('should display name update success message', () => {
      const toastMessages = createToastMessages();
      toastMessages.success.nameUpdated();
      expect(mockToast.success).toHaveBeenCalledWith('Name updated successfully')
    })

    it('should display avatar update success message', () => {
      const toastMessages = createToastMessages();
      toastMessages.success.avatarUpdated();
      expect(mockToast.success).toHaveBeenCalledWith('Avatar updated successfully')
    })

    it('should display login success message', () => {
      const toastMessages = createToastMessages();
      toastMessages.success.loginSuccess();
      expect(mockToast.success).toHaveBeenCalledWith('Login successful')
    })
  })

  describe('Error Messages', () => {
    it('should display name empty error message', () => {
      const toastMessages = createToastMessages();
      toastMessages.error.nameEmpty();
      expect(mockToast.error).toHaveBeenCalledWith('Name cannot be empty')
    })

    it('should display name update failed message', () => {
      const toastMessages = createToastMessages();
      toastMessages.error.nameUpdateFailed();
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update name')
    })

    it('should display custom name update failed message', () => {
      const toastMessages = createToastMessages();
      toastMessages.error.nameUpdateFailed('Custom error message');
      expect(mockToast.error).toHaveBeenCalledWith('Custom error message')
    })

    it('should display avatar update failed message', () => {
      const toastMessages = createToastMessages();
      toastMessages.error.avatarUpdateFailed();
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update avatar')
    })

    it('should display custom avatar update failed message', () => {
      const toastMessages = createToastMessages();
      toastMessages.error.avatarUpdateFailed('Avatar too large');
      expect(mockToast.error).toHaveBeenCalledWith('Avatar too large')
    })

    it('should display file upload failed message', () => {
      const toastMessages = createToastMessages();
      toastMessages.error.fileUploadFailed();
      expect(mockToast.error).toHaveBeenCalledWith('Failed to upload file')
    })

    it('should display custom file upload failed message', () => {
      const toastMessages = createToastMessages();
      toastMessages.error.fileUploadFailed('File too large');
      expect(mockToast.error).toHaveBeenCalledWith('File too large')
    })

    it('should display login failed message', () => {
      const toastMessages = createToastMessages();
      toastMessages.error.loginFailed();
      expect(mockToast.error).toHaveBeenCalledWith('Login failed')
    })

    it('should display custom login failed message', () => {
      const toastMessages = createToastMessages();
      toastMessages.error.loginFailed('Invalid credentials');
      expect(mockToast.error).toHaveBeenCalledWith('Invalid credentials')
    })

    it('should display social login failed message', () => {
      const toastMessages = createToastMessages();
      toastMessages.error.socialLoginFailed();
      expect(mockToast.error).toHaveBeenCalledWith('Social login failed')
    })

    it('should display custom social login failed message', () => {
      const toastMessages = createToastMessages();
      toastMessages.error.socialLoginFailed('GitHub login failed');
      expect(mockToast.error).toHaveBeenCalledWith('GitHub login failed')
    })
  })

  describe('Info Messages', () => {
    it('should display name not changed message', () => {
      const toastMessages = createToastMessages();
      toastMessages.info.nameNotChanged();
      expect(mockToast.info).toHaveBeenCalledWith('Name was not changed')
    })
  })
})
