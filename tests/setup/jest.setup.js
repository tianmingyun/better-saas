// Load comprehensive polyfills FIRST
require('./global-polyfills')

const { config } = require('dotenv')
require('@testing-library/jest-dom')

// Load test environment variables
config({ path: '.env.test' })

// Polyfill Web APIs for Node.js
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
// @ts-ignore - TextDecoder type compatibility issue
global.TextDecoder = TextDecoder

// Mock performance API for jsdom environment
if (typeof global.performance === 'undefined' || !global.performance.getEntriesByName) {
  global.performance = {
    ...global.performance,
    now: () => Date.now(),
    getEntriesByName: () => [],
    mark: () => {},
    measure: () => {},
    clearMarks: () => {},
    clearMeasures: () => {},
    getEntries: () => [],
    getEntriesByType: () => [],
  }
}

// Also set up performance for Node.js environment
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  const { performance } = require('perf_hooks')
  if (!performance.getEntriesByName) {
    performance.getEntriesByName = () => []
  }
}

// Mock fetch instead of using undici to avoid compatibility issues
// Only mock if fetch is not already available (for Node environments)
if (typeof global.fetch === 'undefined') {
  global.fetch = require('node-fetch')
}
// @ts-ignore - Mock type compatibility
global.Request = global.Request || jest.fn()
// @ts-ignore - Mock type compatibility
global.Response = global.Response || jest.fn()

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
  default: function MockImage(props) {
    // Create a simple object that mimics an img element for testing
    return {
      type: 'img',
      props: props,
      toString: () => `<img ${Object.keys(props).map(key => `${key}="${props[key]}"`).join(' ')} />`
    }
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

// Mock window.matchMedia (only in jsdom environment)
if (typeof window !== 'undefined') {
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
}

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
