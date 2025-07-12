/**
 * Performance API Polyfill for Node.js/Test Environment
 * This file provides a polyfill for the performance API in Node.js environments
 * where it might not be fully available or compatible with Next.js expectations.
 */

// Check if we're in a Node.js environment
if (typeof global !== 'undefined' && typeof window === 'undefined') {
  // Try to get the Node.js performance API
  let nodePerformance;
  try {
    nodePerformance = require('perf_hooks').performance;
  } catch (error) {
    // If perf_hooks is not available, create a minimal mock
    nodePerformance = {
      now: () => Date.now(),
    };
  }

  // Add missing Web Stream APIs
  if (typeof global.TextEncoderStream === 'undefined') {
    global.TextEncoderStream = class TextEncoderStream {
      constructor() {
        this.readable = null;
        this.writable = null;
      }
    };
  }

  if (typeof global.TextDecoderStream === 'undefined') {
    global.TextDecoderStream = class TextDecoderStream {
      constructor() {
        this.readable = null;
        this.writable = null;
      }
    };
  }

  if (typeof global.CompressionStream === 'undefined') {
    global.CompressionStream = class CompressionStream {
      constructor(format) {
        this.readable = null;
        this.writable = null;
      }
    };
  }

  if (typeof global.DecompressionStream === 'undefined') {
    global.DecompressionStream = class DecompressionStream {
      constructor(format) {
        this.readable = null;
        this.writable = null;
      }
    };
  }

  // Create a comprehensive performance object
  const performancePolyfill = {
    now: nodePerformance.now.bind(nodePerformance),
    
    // Mock methods that Next.js might expect
    getEntries: () => [],
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    
    // Navigation timing mock
    timing: {
      navigationStart: Date.now(),
      loadEventEnd: Date.now(),
    },
    
    // Resource timing mock
    clearResourceTimings: () => {},
    clearMarks: () => {},
    clearMeasures: () => {},
    
    // User timing mock
    mark: () => {},
    measure: () => {},
    
    // Additional properties that might be expected
    timeOrigin: Date.now(),
  };

  // Set the global performance object
  global.performance = performancePolyfill;

  // Also set it on the global object for broader compatibility
  if (typeof globalThis !== 'undefined') {
    globalThis.performance = performancePolyfill;
  }
}

// For browser environments (jsdom), enhance the existing performance object
if (typeof window !== 'undefined' && window.performance) {
  const originalPerformance = window.performance;
  
  // Ensure all expected methods exist
  if (!originalPerformance.getEntriesByName) {
    originalPerformance.getEntriesByName = () => [];
  }
  
  if (!originalPerformance.getEntries) {
    originalPerformance.getEntries = () => [];
  }
  
  if (!originalPerformance.getEntriesByType) {
    originalPerformance.getEntriesByType = () => [];
  }
  
  if (!originalPerformance.clearResourceTimings) {
    originalPerformance.clearResourceTimings = () => {};
  }
  
  if (!originalPerformance.clearMarks) {
    originalPerformance.clearMarks = () => {};
  }
  
  if (!originalPerformance.clearMeasures) {
    originalPerformance.clearMeasures = () => {};
  }
  
  if (!originalPerformance.mark) {
    originalPerformance.mark = () => {};
  }
  
  if (!originalPerformance.measure) {
    originalPerformance.measure = () => {};
  }
}

module.exports = {}; 