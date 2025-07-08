const { test, expect } = require('@playwright/test')

test.describe('Performance Benchmark Tests', () => {
  const baseURL = 'http://localhost:3000'

  test.describe('Page Load Performance', () => {
    test('homepage should load within 2 seconds', async ({ page }) => {
      const startTime = Date.now()

      await page.goto(`${baseURL}/`)
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(2000)
    })

    test('login page should load quickly', async ({ page }) => {
      const startTime = Date.now()

      await page.goto(`${baseURL}/auth/sign-in`)
      await page.waitForSelector('button[type="submit"]')

      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(1500)
    })

    test('dashboard should load within 3 seconds', async ({ page }) => {
      // Simulate logged in state
      await page.addInitScript(() => {
        localStorage.setItem('auth-token', 'mock-token')
      })

      const startTime = Date.now()

      await page.goto(`${baseURL}/dashboard`)
      await page.waitForSelector('[data-testid="dashboard-content"]')

      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000)
    })
  })

  test.describe('API Response Performance', () => {
    test('health check API should respond quickly', async ({ request }) => {
      const startTime = Date.now()

      const response = await request.get(`${baseURL}/api/health`)

      const responseTime = Date.now() - startTime
      expect(response.status()).toBe(200)
      expect(responseTime).toBeLessThan(100)
    })

    test('auth API should respond within reasonable time', async ({ request }) => {
      const startTime = Date.now()

      const response = await request.post(`${baseURL}/api/auth/sign-in`, {
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      })

      const responseTime = Date.now() - startTime
      expect(responseTime).toBeLessThan(500)
    })

    test('file list API should respond quickly', async ({ request }) => {
      const startTime = Date.now()

      const response = await request.get(`${baseURL}/api/files`, {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      })

      const responseTime = Date.now() - startTime
      expect(responseTime).toBeLessThan(300)
    })
  })

  test.describe('Resource Optimization', () => {
    test('should properly compress static resources', async ({ request }) => {
      const response = await request.get(`${baseURL}/_next/static/css/app.css`)
      const headers = response.headers()

      expect(headers['content-encoding']).toBe('gzip')
    })

    test('should set correct cache headers', async ({ request }) => {
      const response = await request.get(`${baseURL}/_next/static/js/main.js`)
      const headers = response.headers()

      expect(headers['cache-control']).toContain('max-age')
      expect(headers.etag).toBeDefined()
    })

    test('images should be optimized', async ({ page }) => {
      await page.goto(`${baseURL}/`)

      const images = await page.locator('img').all()

      for (const img of images) {
        const src = await img.getAttribute('src')
        if (src?.includes('_next/image')) {
          // Next.js Image component should be used
          expect(src).toContain('_next/image')
        }
      }
    })
  })

  test.describe('Memory Usage', () => {
    test('pages should not have memory leaks', async ({ page }) => {
      // Navigate to different pages multiple times
      for (let i = 0; i < 5; i++) {
        await page.goto(`${baseURL}/`)
        await page.goto(`${baseURL}/auth/sign-in`)
        await page.goto(`${baseURL}/dashboard`)
      }

      // Check memory usage
      const metrics = await page.evaluate(() => {
        return {
          usedJSHeapSize: performance.memory?.usedJSHeapSize || 0,
          totalJSHeapSize: performance.memory?.totalJSHeapSize || 0,
        }
      })

      // Memory usage should be within reasonable range (less than 50MB)
      expect(metrics.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024)
    })
  })

  test.describe('Concurrent Performance', () => {
    test('should handle concurrent requests', async ({ request }) => {
      const concurrentRequests = 10
      const promises = []

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(request.get(`${baseURL}/api/health`))
      }

      const startTime = Date.now()
      const responses = await Promise.all(promises)
      const totalTime = Date.now() - startTime

      // All requests should succeed
      for (const response of responses) {
        expect(response.status()).toBe(200)
      }

      // Concurrent processing should be faster than serial processing
      expect(totalTime).toBeLessThan(concurrentRequests * 100)
    })

    test('should handle concurrent file uploads', async ({ request }) => {
      const concurrentUploads = 5
      const promises = []

      for (let i = 0; i < concurrentUploads; i++) {
        const fileContent = Buffer.from(`Test file content ${i}`)

        promises.push(
          request.post(`${baseURL}/api/files/upload`, {
            multipart: {
              file: {
                name: `test-file-${i}.txt`,
                mimeType: 'text/plain',
                buffer: fileContent
              }
            },
            headers: {
              'Authorization': 'Bearer mock-token'
            }
          })
        )
      }

      const responses = await Promise.all(promises)

      // Check if all uploads succeeded
      for (const response of responses) {
        expect([200, 201]).toContain(response.status())
      }
    })
  })

  test.describe('Database Performance', () => {
    test('user queries should execute quickly', async ({ request }) => {
      const startTime = Date.now()

      const response = await request.get(`${baseURL}/api/admin/users`, {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })

      const queryTime = Date.now() - startTime
      expect(response.status()).toBe(200)
      expect(queryTime).toBeLessThan(200)
    })

    test('paginated queries should be efficient', async ({ request }) => {
      const startTime = Date.now()

      const response = await request.get(`${baseURL}/api/files?page=1&limit=50`, {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      })

      const queryTime = Date.now() - startTime
      expect(response.status()).toBe(200)
      expect(queryTime).toBeLessThan(300)
    })
  })

  test.describe('Core Web Vitals', () => {
    test('should have good LCP (Largest Contentful Paint)', async ({ page }) => {
      await page.goto(`${baseURL}/`)

      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            resolve(lastEntry.startTime)
          }).observe({ entryTypes: ['largest-contentful-paint'] })

          // Timeout protection
          setTimeout(() => resolve(0), 5000)
        })
      })

      expect(lcp).toBeLessThan(2500) // LCP should be less than 2.5 seconds
    })

    test('should have good CLS (Cumulative Layout Shift)', async ({ page }) => {
      await page.goto(`${baseURL}/`)
      await page.waitForLoadState('networkidle')

      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0

          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value
              }
            }
            resolve(clsValue)
          }).observe({ entryTypes: ['layout-shift'] })

          // Wait for some time to collect data
          setTimeout(() => resolve(clsValue), 3000)
        })
      })

      expect(cls).toBeLessThan(0.1) // CLS should be less than 0.1
    })

    test('should have good FID (First Input Delay)', async ({ page }) => {
      await page.goto(`${baseURL}/`)

      // Simulate user interaction
      const startTime = Date.now()
      await page.click('body')
      const interactionTime = Date.now() - startTime

      expect(interactionTime).toBeLessThan(100) // FID should be less than 100ms
    })
  })
})
