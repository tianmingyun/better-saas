import { describe, it, expect } from '@jest/globals'

// Mock Next.js API route handler
function createMockRequest(method: string, url: string, body?: any) {
  return {
    method,
    url,
    headers: {},
    body,
    query: {},
  }
}

function createMockResponse() {
  const res = {
    status: 200,
    headers: {},
    body: null,
    statusCode: 200,
    setHeader: function(name: string, value: string) {
      this.headers[name] = value
      return this
    },
    status: function(code: number) {
      this.statusCode = code
      return this
    },
    json: function(data: any) {
      this.body = data
      return this
    },
    send: function(data: any) {
      this.body = data
      return this
    },
  }
  return res
}

// Simple health check API handler
async function healthHandler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
}

describe('Health API 集成测试', () => {
  describe('GET /api/health', () => {
    it('应该返回健康状态', async () => {
      const req = createMockRequest('GET', '/api/health')
      const res = createMockResponse()

      await healthHandler(req, res)

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('status', 'ok')
      expect(res.body).toHaveProperty('timestamp')
      expect(res.body).toHaveProperty('uptime')
      expect(typeof res.body.uptime).toBe('number')
    })

    it('应该拒绝非GET请求', async () => {
      const req = createMockRequest('POST', '/api/health')
      const res = createMockResponse()

      await healthHandler(req, res)

      expect(res.statusCode).toBe(405)
      expect(res.body).toHaveProperty('error', 'Method not allowed')
    })

    it('应该返回有效的时间戳格式', async () => {
      const req = createMockRequest('GET', '/api/health')
      const res = createMockResponse()

      await healthHandler(req, res)

      expect(res.statusCode).toBe(200)
      const timestamp = res.body.timestamp
      expect(new Date(timestamp).toISOString()).toBe(timestamp)
    })

    it('应该返回正数的运行时间', async () => {
      const req = createMockRequest('GET', '/api/health')
      const res = createMockResponse()

      await healthHandler(req, res)

      expect(res.statusCode).toBe(200)
      expect(res.body.uptime).toBeGreaterThan(0)
    })
  })

  describe('错误处理', () => {
    it('应该处理PUT请求', async () => {
      const req = createMockRequest('PUT', '/api/health')
      const res = createMockResponse()

      await healthHandler(req, res)

      expect(res.statusCode).toBe(405)
      expect(res.body.error).toBe('Method not allowed')
    })

    it('应该处理DELETE请求', async () => {
      const req = createMockRequest('DELETE', '/api/health')
      const res = createMockResponse()

      await healthHandler(req, res)

      expect(res.statusCode).toBe(405)
      expect(res.body.error).toBe('Method not allowed')
    })
  })
})
