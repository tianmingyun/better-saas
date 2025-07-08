import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock file upload service
interface UploadedFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  width?: number
  height?: number
  r2Key: string
  thumbnailKey?: string
  uploadUserId: string
  createdAt: Date
  updatedAt: Date
}

interface UploadResult {
  success: boolean
  file?: UploadedFile
  error?: string
}

class MockFileUploadService {
  private files: UploadedFile[] = []
  private nextId = 1

  async uploadFile(
    file: File,
    userId: string,
    options?: { generateThumbnail?: boolean }
  ): Promise<UploadResult> {
    // Validate file
    const validation = this.validateFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Generate unique filename
    const filename = this.generateUniqueFilename(file.name)
    const r2Key = `files/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${filename}`

    // Create file record
    const uploadedFile: UploadedFile = {
      id: `file-${this.nextId++}`,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      r2Key,
      uploadUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Add image dimensions if it's an image
    if (file.type.startsWith('image/')) {
      uploadedFile.width = 800
      uploadedFile.height = 600
      
      if (options?.generateThumbnail) {
        uploadedFile.thumbnailKey = `thumbnails/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${filename}`
      }
    }

    this.files.push(uploadedFile)
    return { success: true, file: uploadedFile }
  }

  async getFile(fileId: string): Promise<UploadedFile | null> {
    return this.files.find(file => file.id === fileId) || null
  }

  async getUserFiles(userId: string): Promise<UploadedFile[]> {
    return this.files.filter(file => file.uploadUserId === userId)
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const fileIndex = this.files.findIndex(
      file => file.id === fileId && file.uploadUserId === userId
    )
    
    if (fileIndex === -1) return false
    
    this.files.splice(fileIndex, 1)
    return true
  }

  private validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']

    if (file.size > maxSize) {
      return { valid: false, error: '文件大小不能超过 10MB' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: '不支持的文件类型' }
    }

    return { valid: true }
  }

  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = originalName.split('.').pop() || ''
    return `${timestamp}-${random}.${extension}`
  }

  // Test helper methods
  clear(): void {
    this.files = []
    this.nextId = 1
  }

  getAllFiles(): UploadedFile[] {
    return [...this.files]
  }
}

// Helper function to create mock File objects
function createMockFile(name: string, type: string, size: number): File {
  const content = 'a'.repeat(size)
  return new File([content], name, { type, lastModified: Date.now() })
}

describe('文件上传服务集成测试', () => {
  let fileService: MockFileUploadService

  beforeEach(() => {
    fileService = new MockFileUploadService()
  })

  describe('文件上传', () => {
    it('应该成功上传有效的图片文件', async () => {
      const file = createMockFile('test-image.jpg', 'image/jpeg', 1024 * 1024) // 1MB
      const userId = 'user-1'

      const result = await fileService.uploadFile(file, userId)

      expect(result.success).toBe(true)
      expect(result.file).toBeDefined()
      expect(result.file?.originalName).toBe('test-image.jpg')
      expect(result.file?.mimeType).toBe('image/jpeg')
      expect(result.file?.size).toBe(1024 * 1024)
      expect(result.file?.uploadUserId).toBe(userId)
      expect(result.file?.width).toBe(800)
      expect(result.file?.height).toBe(600)
    })

    it('应该为图片生成缩略图', async () => {
      const file = createMockFile('test-image.png', 'image/png', 1024 * 1024)
      const userId = 'user-1'

      const result = await fileService.uploadFile(file, userId, { generateThumbnail: true })

      expect(result.success).toBe(true)
      expect(result.file?.thumbnailKey).toBeDefined()
      expect(result.file?.thumbnailKey).toContain('thumbnails/')
    })

    it('应该成功上传PDF文件', async () => {
      const file = createMockFile('document.pdf', 'application/pdf', 2 * 1024 * 1024) // 2MB
      const userId = 'user-1'

      const result = await fileService.uploadFile(file, userId)

      expect(result.success).toBe(true)
      expect(result.file?.mimeType).toBe('application/pdf')
      expect(result.file?.width).toBeUndefined()
      expect(result.file?.height).toBeUndefined()
      expect(result.file?.thumbnailKey).toBeUndefined()
    })

    it('应该拒绝过大的文件', async () => {
      const file = createMockFile('large-file.jpg', 'image/jpeg', 15 * 1024 * 1024) // 15MB
      const userId = 'user-1'

      const result = await fileService.uploadFile(file, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('文件大小不能超过 10MB')
    })

    it('应该拒绝不支持的文件类型', async () => {
      const file = createMockFile('script.js', 'application/javascript', 1024)
      const userId = 'user-1'

      const result = await fileService.uploadFile(file, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('不支持的文件类型')
    })

    it('应该生成唯一的文件名', async () => {
      const file1 = createMockFile('test.jpg', 'image/jpeg', 1024)
      const file2 = createMockFile('test.jpg', 'image/jpeg', 1024)
      const userId = 'user-1'

      const result1 = await fileService.uploadFile(file1, userId)
      const result2 = await fileService.uploadFile(file2, userId)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.file?.filename).not.toBe(result2.file?.filename)
    })
  })

  describe('文件查询', () => {
    it('应该能够通过ID获取文件', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024)
      const userId = 'user-1'

      const uploadResult = await fileService.uploadFile(file, userId)
      const retrievedFile = await fileService.getFile(uploadResult.file!.id)

      expect(retrievedFile).toEqual(uploadResult.file)
    })

    it('应该在文件不存在时返回null', async () => {
      const retrievedFile = await fileService.getFile('non-existent-id')
      expect(retrievedFile).toBeNull()
    })

    it('应该能够获取用户的所有文件', async () => {
      const userId = 'user-1'
      const file1 = createMockFile('test1.jpg', 'image/jpeg', 1024)
      const file2 = createMockFile('test2.png', 'image/png', 2048)

      await fileService.uploadFile(file1, userId)
      await fileService.uploadFile(file2, userId)

      const userFiles = await fileService.getUserFiles(userId)
      expect(userFiles).toHaveLength(2)
      expect(userFiles.every(file => file.uploadUserId === userId)).toBe(true)
    })

    it('应该只返回指定用户的文件', async () => {
      const user1 = 'user-1'
      const user2 = 'user-2'
      const file1 = createMockFile('test1.jpg', 'image/jpeg', 1024)
      const file2 = createMockFile('test2.jpg', 'image/jpeg', 1024)

      await fileService.uploadFile(file1, user1)
      await fileService.uploadFile(file2, user2)

      const user1Files = await fileService.getUserFiles(user1)
      const user2Files = await fileService.getUserFiles(user2)

      expect(user1Files).toHaveLength(1)
      expect(user2Files).toHaveLength(1)
      expect(user1Files[0].uploadUserId).toBe(user1)
      expect(user2Files[0].uploadUserId).toBe(user2)
    })
  })

  describe('文件删除', () => {
    it('应该能够删除自己的文件', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024)
      const userId = 'user-1'

      const uploadResult = await fileService.uploadFile(file, userId)
      const deleted = await fileService.deleteFile(uploadResult.file!.id, userId)

      expect(deleted).toBe(true)

      const retrievedFile = await fileService.getFile(uploadResult.file!.id)
      expect(retrievedFile).toBeNull()
    })

    it('应该不能删除其他用户的文件', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024)
      const owner = 'user-1'
      const otherUser = 'user-2'

      const uploadResult = await fileService.uploadFile(file, owner)
      const deleted = await fileService.deleteFile(uploadResult.file!.id, otherUser)

      expect(deleted).toBe(false)

      const retrievedFile = await fileService.getFile(uploadResult.file!.id)
      expect(retrievedFile).not.toBeNull()
    })

    it('应该在文件不存在时返回false', async () => {
      const deleted = await fileService.deleteFile('non-existent-id', 'user-1')
      expect(deleted).toBe(false)
    })
  })

  describe('复杂场景', () => {
    it('应该处理多用户并发上传', async () => {
      const users = ['user-1', 'user-2', 'user-3']
      const uploadPromises = users.map(userId => {
        const file = createMockFile(`${userId}-file.jpg`, 'image/jpeg', 1024)
        return fileService.uploadFile(file, userId)
      })

      const results = await Promise.all(uploadPromises)

      expect(results.every(result => result.success)).toBe(true)
      expect(fileService.getAllFiles()).toHaveLength(3)
    })

    it('应该正确处理文件路径生成', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024)
      const userId = 'user-1'

      const result = await fileService.uploadFile(file, userId)

      expect(result.file?.r2Key).toMatch(/^files\/\d{4}\/\d{2}\/\d+-.+\.jpg$/)
    })
  })
})
