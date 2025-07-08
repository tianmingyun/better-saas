import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { renderHook } from '@testing-library/react'
import { useToastMessages } from '@/hooks/use-toast-messages'
import { render } from '@/tests/setup/test-utils'

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

describe('useToastMessages Hook测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderUseToastMessages = () => {
    return renderHook(() => useToastMessages(), {
      wrapper: ({ children }) => render(<div>{children}</div>).container,
    })
  }

  describe('成功消息', () => {
    it('应该显示名称更新成功消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.success.nameUpdated()
      
      expect(mockToast.success).toHaveBeenCalledWith('Name updated successfully')
    })

    it('应该显示头像更新成功消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.success.avatarUpdated()
      
      expect(mockToast.success).toHaveBeenCalledWith('Avatar updated successfully')
    })

    it('应该显示登录成功消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.success.loginSuccess()
      
      expect(mockToast.success).toHaveBeenCalledWith('Login successful')
    })
  })

  describe('错误消息', () => {
    it('应该显示名称为空错误消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.error.nameEmpty()
      
      expect(mockToast.error).toHaveBeenCalledWith('Name cannot be empty')
    })

    it('应该显示名称更新失败消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.error.nameUpdateFailed()
      
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update name')
    })

    it('应该显示自定义名称更新失败消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.error.nameUpdateFailed('Custom error message')
      
      expect(mockToast.error).toHaveBeenCalledWith('Custom error message')
    })

    it('应该显示头像更新失败消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.error.avatarUpdateFailed()
      
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update avatar')
    })

    it('应该显示自定义头像更新失败消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.error.avatarUpdateFailed('Avatar too large')
      
      expect(mockToast.error).toHaveBeenCalledWith('Avatar too large')
    })

    it('应该显示文件上传失败消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.error.fileUploadFailed()
      
      expect(mockToast.error).toHaveBeenCalledWith('Failed to upload file')
    })

    it('应该显示自定义文件上传失败消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.error.fileUploadFailed('File too large')
      
      expect(mockToast.error).toHaveBeenCalledWith('File too large')
    })

    it('应该显示登录失败消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.error.loginFailed()
      
      expect(mockToast.error).toHaveBeenCalledWith('Login failed')
    })

    it('应该显示自定义登录失败消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.error.loginFailed('Invalid credentials')
      
      expect(mockToast.error).toHaveBeenCalledWith('Invalid credentials')
    })

    it('应该显示社交登录失败消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.error.socialLoginFailed()
      
      expect(mockToast.error).toHaveBeenCalledWith('Social login failed')
    })

    it('应该显示自定义社交登录失败消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.error.socialLoginFailed('GitHub login failed')
      
      expect(mockToast.error).toHaveBeenCalledWith('GitHub login failed')
    })
  })

  describe('信息消息', () => {
    it('应该显示名称未更改消息', () => {
      const { result } = renderUseToastMessages()
      
      result.current.info.nameNotChanged()
      
      expect(mockToast.info).toHaveBeenCalledWith('Name was not changed')
    })
  })
})
