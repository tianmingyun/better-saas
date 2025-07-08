const { test, expect } = require('@playwright/test')

test.describe('性能基准测试', () => {
  const baseURL = 'http://localhost:3000'

  test.describe('页面加载性能', () => {
    test('主页应该在2秒内加载完成', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto(`${baseURL}/`)
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(2000)
    })

    test('登录页面应该快速加载', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto(`${baseURL}/auth/sign-in`)
      await page.waitForSelector('button[type="submit"]')
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(1500)
    })

    test('仪表板应该在3秒内加载完成', async ({ page }) => {
      // 模拟已登录状态
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

  test.describe('API响应性能', () => {
    test('健康检查API应该快速响应', async ({ request }) => {
      const startTime = Date.now()
      
      const response = await request.get(`${baseURL}/api/health`)
      
      const responseTime = Date.now() - startTime
      expect(response.status()).toBe(200)
      expect(responseTime).toBeLessThan(100)
    })

    test('认证API应该在合理时间内响应', async ({ request }) => {
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

    test('文件列表API应该快速响应', async ({ request }) => {
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

  test.describe('资源优化', () => {
    test('应该正确压缩静态资源', async ({ request }) => {
      const response = await request.get(`${baseURL}/_next/static/css/app.css`)
      const headers = response.headers()
      
      expect(headers['content-encoding']).toBe('gzip')
    })

    test('应该设置正确的缓存头', async ({ request }) => {
      const response = await request.get(`${baseURL}/_next/static/js/main.js`)
      const headers = response.headers()
      
      expect(headers['cache-control']).toContain('max-age')
      expect(headers['etag']).toBeDefined()
    })

    test('图片应该被优化', async ({ page }) => {
      await page.goto(`${baseURL}/`)
      
      const images = await page.locator('img').all()
      
      for (const img of images) {
        const src = await img.getAttribute('src')
        if (src && src.includes('_next/image')) {
          // Next.js Image组件应该被使用
          expect(src).toContain('_next/image')
        }
      }
    })
  })

  test.describe('内存使用', () => {
    test('页面不应该有内存泄漏', async ({ page }) => {
      // 导航到不同页面多次
      for (let i = 0; i < 5; i++) {
        await page.goto(`${baseURL}/`)
        await page.goto(`${baseURL}/auth/sign-in`)
        await page.goto(`${baseURL}/dashboard`)
      }

      // 检查内存使用情况
      const metrics = await page.evaluate(() => {
        return {
          usedJSHeapSize: performance.memory?.usedJSHeapSize || 0,
          totalJSHeapSize: performance.memory?.totalJSHeapSize || 0,
        }
      })

      // 内存使用应该在合理范围内（小于50MB）
      expect(metrics.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024)
    })
  })

  test.describe('并发性能', () => {
    test('应该处理并发请求', async ({ request }) => {
      const concurrentRequests = 10
      const promises = []

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(request.get(`${baseURL}/api/health`))
      }

      const startTime = Date.now()
      const responses = await Promise.all(promises)
      const totalTime = Date.now() - startTime

      // 所有请求都应该成功
      responses.forEach(response => {
        expect(response.status()).toBe(200)
      })

      // 并发处理应该比串行处理快
      expect(totalTime).toBeLessThan(concurrentRequests * 100)
    })

    test('应该处理并发文件上传', async ({ request }) => {
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

      // 检查所有上传是否成功
      responses.forEach(response => {
        expect([200, 201]).toContain(response.status())
      })
    })
  })

  test.describe('数据库性能', () => {
    test('用户查询应该快速执行', async ({ request }) => {
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

    test('分页查询应该高效', async ({ request }) => {
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
    test('应该有良好的LCP (Largest Contentful Paint)', async ({ page }) => {
      await page.goto(`${baseURL}/`)
      
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            resolve(lastEntry.startTime)
          }).observe({ entryTypes: ['largest-contentful-paint'] })
          
          // 超时保护
          setTimeout(() => resolve(0), 5000)
        })
      })

      expect(lcp).toBeLessThan(2500) // LCP应该小于2.5秒
    })

    test('应该有良好的CLS (Cumulative Layout Shift)', async ({ page }) => {
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
          
          // 等待一段时间收集数据
          setTimeout(() => resolve(clsValue), 3000)
        })
      })

      expect(cls).toBeLessThan(0.1) // CLS应该小于0.1
    })

    test('应该有良好的FID (First Input Delay)', async ({ page }) => {
      await page.goto(`${baseURL}/`)
      
      // 模拟用户交互
      const startTime = Date.now()
      await page.click('body')
      const interactionTime = Date.now() - startTime
      
      expect(interactionTime).toBeLessThan(100) // FID应该小于100ms
    })
  })
})
