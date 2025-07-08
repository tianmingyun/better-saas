const { test, expect } = require('@playwright/test')

test.describe('安全测试', () => {
  const baseURL = 'http://localhost:3000'

  test.describe('认证和授权', () => {
    test('应该拒绝未认证的API请求', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/dashboard/stats`)
      expect(response.status()).toBe(401)
    })

    test('应该拒绝无效的JWT令牌', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/dashboard/stats`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })
      expect(response.status()).toBe(401)
    })

    test('应该拒绝过期的JWT令牌', async ({ request }) => {
      // 使用过期的令牌
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid'
      
      const response = await request.get(`${baseURL}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      })
      expect(response.status()).toBe(401)
    })

    test('应该拒绝普通用户访问管理员API', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/admin/users`, {
        headers: {
          'Authorization': 'Bearer user-token'
        }
      })
      expect(response.status()).toBe(403)
    })
  })

  test.describe('输入验证', () => {
    test('应该防止SQL注入攻击', async ({ request }) => {
      const maliciousPayload = {
        email: "admin@example.com'; DROP TABLE users; --",
        password: 'password123'
      }

      const response = await request.post(`${baseURL}/api/auth/sign-in`, {
        data: maliciousPayload
      })

      // 应该返回验证错误，而不是服务器错误
      expect(response.status()).toBe(400)
    })

    test('应该防止XSS攻击', async ({ page }) => {
      await page.goto(`${baseURL}/auth/sign-in`)

      // 尝试注入恶意脚本
      const maliciousScript = '<script>alert("XSS")</script>'
      
      await page.fill('input[type="email"]', maliciousScript)
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      // 检查脚本是否被正确转义
      const emailValue = await page.inputValue('input[type="email"]')
      expect(emailValue).not.toContain('<script>')
    })

    test('应该验证文件上传类型', async ({ request }) => {
      // 尝试上传恶意文件
      const maliciousFile = Buffer.from('<?php echo "Hacked!"; ?>')
      
      const response = await request.post(`${baseURL}/api/files/upload`, {
        multipart: {
          file: {
            name: 'malicious.php',
            mimeType: 'application/x-php',
            buffer: maliciousFile
          }
        },
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('不支持的文件类型')
    })

    test('应该限制文件上传大小', async ({ request }) => {
      // 创建超大文件
      const largeFile = Buffer.alloc(15 * 1024 * 1024) // 15MB
      
      const response = await request.post(`${baseURL}/api/files/upload`, {
        multipart: {
          file: {
            name: 'large-file.jpg',
            mimeType: 'image/jpeg',
            buffer: largeFile
          }
        },
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('文件大小不能超过')
    })
  })

  test.describe('CSRF防护', () => {
    test('应该要求CSRF令牌', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/auth/sign-out`, {
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      // 如果没有CSRF令牌，应该被拒绝
      expect([403, 422]).toContain(response.status())
    })

    test('应该验证CSRF令牌', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/auth/sign-out`, {
        headers: {
          'Authorization': 'Bearer valid-token',
          'X-CSRF-Token': 'invalid-csrf-token'
        }
      })

      expect(response.status()).toBe(403)
    })
  })

  test.describe('速率限制', () => {
    test('应该限制登录尝试次数', async ({ request }) => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong-password'
      }

      // 快速发送多个失败的登录请求
      const promises = Array(10).fill().map(() => 
        request.post(`${baseURL}/api/auth/sign-in`, { data: loginData })
      )

      const responses = await Promise.all(promises)
      
      // 应该有一些请求被速率限制
      const rateLimitedResponses = responses.filter(r => r.status() === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    test('应该限制API请求频率', async ({ request }) => {
      // 快速发送多个API请求
      const promises = Array(50).fill().map(() => 
        request.get(`${baseURL}/api/health`)
      )

      const responses = await Promise.all(promises)
      
      // 检查是否有速率限制响应
      const rateLimitedResponses = responses.filter(r => r.status() === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  test.describe('HTTP安全头', () => {
    test('应该设置安全HTTP头', async ({ request }) => {
      const response = await request.get(`${baseURL}/`)
      const headers = response.headers()

      // 检查重要的安全头
      expect(headers['x-frame-options']).toBeDefined()
      expect(headers['x-content-type-options']).toBe('nosniff')
      expect(headers['x-xss-protection']).toBeDefined()
      expect(headers['strict-transport-security']).toBeDefined()
      expect(headers['content-security-policy']).toBeDefined()
    })

    test('应该设置正确的CSP策略', async ({ request }) => {
      const response = await request.get(`${baseURL}/`)
      const csp = response.headers()['content-security-policy']

      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src")
      expect(csp).toContain("style-src")
      expect(csp).toContain("img-src")
    })
  })

  test.describe('敏感信息泄露', () => {
    test('不应该在错误响应中泄露敏感信息', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/non-existent-endpoint`)
      const body = await response.text()

      // 检查是否泄露了敏感信息
      expect(body).not.toContain('password')
      expect(body).not.toContain('secret')
      expect(body).not.toContain('token')
      expect(body).not.toContain('database')
      expect(body).not.toContain('stack trace')
    })

    test('不应该在响应头中泄露服务器信息', async ({ request }) => {
      const response = await request.get(`${baseURL}/`)
      const headers = response.headers()

      // 检查是否泄露了服务器信息
      expect(headers['server']).toBeUndefined()
      expect(headers['x-powered-by']).toBeUndefined()
    })
  })

  test.describe('会话安全', () => {
    test('应该在登出后使会话无效', async ({ request }) => {
      // 模拟登录获取令牌
      const loginResponse = await request.post(`${baseURL}/api/auth/sign-in`, {
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      })

      const { token } = await loginResponse.json()

      // 使用令牌访问受保护的资源
      let protectedResponse = await request.get(`${baseURL}/api/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      expect(protectedResponse.status()).toBe(200)

      // 登出
      await request.post(`${baseURL}/api/auth/sign-out`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // 再次尝试访问受保护的资源
      protectedResponse = await request.get(`${baseURL}/api/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      expect(protectedResponse.status()).toBe(401)
    })

    test('应该设置安全的Cookie属性', async ({ page }) => {
      await page.goto(`${baseURL}/auth/sign-in`)
      
      // 模拟登录
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      // 检查Cookie属性
      const cookies = await page.context().cookies()
      const authCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session'))

      if (authCookie) {
        expect(authCookie.httpOnly).toBe(true)
        expect(authCookie.secure).toBe(true) // 在HTTPS环境中
        expect(authCookie.sameSite).toBe('Strict')
      }
    })
  })
})
