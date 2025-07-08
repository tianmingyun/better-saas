const { test, expect } = require('@playwright/test')

test.describe('Security Tests', () => {
  const baseURL = 'http://localhost:3000'

  test.describe('Authentication and Authorization', () => {
    test('should reject unauthenticated API requests', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/dashboard/stats`)
      expect(response.status()).toBe(401)
    })

    test('should reject invalid JWT tokens', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/dashboard/stats`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })
      expect(response.status()).toBe(401)
    })

    test('should reject expired JWT tokens', async ({ request }) => {
      // Use expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid'

      const response = await request.get(`${baseURL}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      })
      expect(response.status()).toBe(401)
    })

    test('should reject regular user access to admin API', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/admin/users`, {
        headers: {
          'Authorization': 'Bearer user-token'
        }
      })
      expect(response.status()).toBe(403)
    })
  })

  test.describe('Input Validation', () => {
    test('should prevent SQL injection attacks', async ({ request }) => {
      const maliciousPayload = {
        email: "admin@example.com'; DROP TABLE users; --",
        password: 'password123'
      }

      const response = await request.post(`${baseURL}/api/auth/sign-in`, {
        data: maliciousPayload
      })

      // Should return validation error, not server error
      expect(response.status()).toBe(400)
    })

    test('should prevent XSS attacks', async ({ page }) => {
      await page.goto(`${baseURL}/auth/sign-in`)

      // Try to inject malicious script
      const maliciousScript = '<script>alert("XSS")</script>'

      await page.fill('input[type="email"]', maliciousScript)
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      // Check if script is properly escaped
      const emailValue = await page.inputValue('input[type="email"]')
      expect(emailValue).not.toContain('<script>')
    })

    test('should validate file upload types', async ({ request }) => {
      // Try to upload malicious file
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
      expect(body.error).toContain('Unsupported file type')
    })

    test('should limit file upload size', async ({ request }) => {
      // Create oversized file
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
      expect(body.error).toContain('File size cannot exceed')
    })
  })

  test.describe('CSRF Protection', () => {
    test('should require CSRF token', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/auth/sign-out`, {
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      // Should be rejected if no CSRF token
      expect([403, 422]).toContain(response.status())
    })

    test('should validate CSRF token', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/auth/sign-out`, {
        headers: {
          'Authorization': 'Bearer valid-token',
          'X-CSRF-Token': 'invalid-csrf-token'
        }
      })

      expect(response.status()).toBe(403)
    })
  })

  test.describe('Rate Limiting', () => {
    test('should limit login attempt frequency', async ({ request }) => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong-password'
      }

      // Rapidly send multiple failed login requests
      const promises = Array(10).fill(null).map(() =>
        request.post(`${baseURL}/api/auth/sign-in`, { data: loginData })
      )

      const responses = await Promise.all(promises)

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status() === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    test('should limit API request frequency', async ({ request }) => {
      // Rapidly send multiple API requests
      const promises = Array(50).fill(null).map(() =>
        request.get(`${baseURL}/api/health`)
      )

      const responses = await Promise.all(promises)

      // Check for rate limit responses
      const rateLimitedResponses = responses.filter(r => r.status() === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  test.describe('HTTP Security Headers', () => {
    test('should set security HTTP headers', async ({ request }) => {
      const response = await request.get(`${baseURL}/`)
      const headers = response.headers()

      // Check important security headers
      expect(headers['x-frame-options']).toBeDefined()
      expect(headers['x-content-type-options']).toBe('nosniff')
      expect(headers['x-xss-protection']).toBeDefined()
      expect(headers['strict-transport-security']).toBeDefined()
      expect(headers['content-security-policy']).toBeDefined()
    })

    test('should set correct CSP policy', async ({ request }) => {
      const response = await request.get(`${baseURL}/`)
      const csp = response.headers()['content-security-policy']

      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src")
      expect(csp).toContain("style-src")
      expect(csp).toContain("img-src")
    })
  })

  test.describe('Sensitive Information Disclosure', () => {
    test('should not leak sensitive information in error responses', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/non-existent-endpoint`)
      const body = await response.text()

      // Check for sensitive information leakage
      expect(body).not.toContain('password')
      expect(body).not.toContain('secret')
      expect(body).not.toContain('token')
      expect(body).not.toContain('database')
      expect(body).not.toContain('stack trace')
    })

    test('should not leak server information in response headers', async ({ request }) => {
      const response = await request.get(`${baseURL}/`)
      const headers = response.headers()

      // Check for server information leakage
      expect(headers.server).toBeUndefined()
      expect(headers['x-powered-by']).toBeUndefined()
    })
  })

  test.describe('Session Security', () => {
    test('should invalidate session after logout', async ({ request }) => {
      // Simulate login to get token
      const loginResponse = await request.post(`${baseURL}/api/auth/sign-in`, {
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      })

      const { token } = await loginResponse.json()

      // Use token to access protected resource
      let protectedResponse = await request.get(`${baseURL}/api/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      expect(protectedResponse.status()).toBe(200)

      // Logout
      await request.post(`${baseURL}/api/auth/sign-out`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Try to access protected resource again
      protectedResponse = await request.get(`${baseURL}/api/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      expect(protectedResponse.status()).toBe(401)
    })

    test('should set secure Cookie attributes', async ({ page }) => {
      await page.goto(`${baseURL}/auth/sign-in`)

      // Simulate login
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      // Check Cookie attributes
      const cookies = await page.context().cookies()
      const authCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session'))

      if (authCookie) {
        expect(authCookie.httpOnly).toBe(true)
        expect(authCookie.secure).toBe(true) // In HTTPS environment
        expect(authCookie.sameSite).toBe('Strict')
      }
    })
  })
})
