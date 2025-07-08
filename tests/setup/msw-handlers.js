import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock auth endpoints
  http.post('/api/auth/sign-in', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      },
      session: {
        id: 'test-session-id',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    })
  }),

  http.post('/api/auth/sign-up', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      },
    })
  }),

  http.post('/api/auth/sign-out', () => {
    return HttpResponse.json({ success: true })
  }),

  http.get('/api/auth/session', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      },
      session: {
        id: 'test-session-id',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    })
  }),

  // Mock file endpoints
  http.get('/api/files', () => {
    return HttpResponse.json({
      files: [
        {
          id: 'test-file-1',
          filename: 'test-image.jpg',
          originalName: 'test-image.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          width: 800,
          height: 600,
          uploadUserId: 'test-user-id',
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    })
  }),

  http.post('/api/files/upload', () => {
    return HttpResponse.json({
      file: {
        id: 'test-file-1',
        filename: 'test-image.jpg',
        originalName: 'test-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        width: 800,
        height: 600,
        uploadUserId: 'test-user-id',
        createdAt: new Date().toISOString(),
      },
    })
  }),

  // Mock Stripe endpoints
  http.post('/api/stripe/create-checkout-session', () => {
    return HttpResponse.json({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    })
  }),

  http.post('/api/stripe/webhook', () => {
    return HttpResponse.json({ received: true })
  }),

  // Mock admin endpoints
  http.get('/api/admin/users', () => {
    return HttpResponse.json({
      users: [
        {
          id: 'test-user-1',
          email: 'user1@example.com',
          name: 'User 1',
          role: 'user',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'test-user-2',
          email: 'user2@example.com',
          name: 'User 2',
          role: 'user',
          createdAt: new Date().toISOString(),
        },
      ],
      total: 2,
    })
  }),
]
