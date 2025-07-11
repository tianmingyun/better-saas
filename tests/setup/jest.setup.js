import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

// Polyfill Web APIs for Node.js
global.TextEncoder = TextEncoder
// @ts-ignore - TextDecoder type compatibility issue
global.TextDecoder = TextDecoder

// Mock fetch instead of using undici to avoid compatibility issues
// @ts-ignore - Mock type compatibility
global.fetch = jest.fn()
// @ts-ignore - Mock type compatibility
global.Request = jest.fn()
// @ts-ignore - Mock type compatibility
global.Response = jest.fn()

// Mock @t3-oss/env-nextjs
jest.mock('@t3-oss/env-nextjs', () => ({
  createEnv: jest.fn(() => process.env),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  // @ts-ignore - Props type
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock console methods in tests
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver with proper implementation
global.IntersectionObserver = class IntersectionObserver {
  constructor() {
    this.root = null
    this.rootMargin = ''
    this.thresholds = []
  }
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return [] }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}
