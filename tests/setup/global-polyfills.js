/**
 * Global Polyfills for Next.js Edge Runtime in Test Environment
 * This file provides comprehensive polyfills for Web APIs that are missing
 * when running Next.js in a test environment.
 */

// Text encoding/decoding polyfills
const { TextEncoder, TextDecoder } = require('util');

// Set up basic text encoding
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Web Streams API polyfills
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor(underlyingSource = {}) {
      this.locked = false;
      this._reader = null;
    }

    getReader() {
      if (this._reader) {
        throw new TypeError('ReadableStream is locked');
      }
      this._reader = new ReadableStreamDefaultReader();
      this.locked = true;
      return this._reader;
    }

    cancel() {
      return Promise.resolve();
    }
  };

  global.ReadableStreamDefaultReader = class ReadableStreamDefaultReader {
    constructor() {
      this.closed = Promise.resolve();
    }

    read() {
      return Promise.resolve({ done: true, value: undefined });
    }

    releaseLock() {
      // Mock implementation
    }

    cancel() {
      return Promise.resolve();
    }
  };
}

if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = class WritableStream {
    constructor(underlyingSink = {}) {
      this.locked = false;
      this._writer = null;
    }

    getWriter() {
      if (this._writer) {
        throw new TypeError('WritableStream is locked');
      }
      this._writer = new WritableStreamDefaultWriter();
      this.locked = true;
      return this._writer;
    }

    abort() {
      return Promise.resolve();
    }
  };

  global.WritableStreamDefaultWriter = class WritableStreamDefaultWriter {
    constructor() {
      this.closed = Promise.resolve();
      this.ready = Promise.resolve();
    }

    write(chunk) {
      return Promise.resolve();
    }

    close() {
      return Promise.resolve();
    }

    abort() {
      return Promise.resolve();
    }

    releaseLock() {
      // Mock implementation
    }
  };
}

if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = class TransformStream {
    constructor(transformer = {}) {
      this.readable = new global.ReadableStream();
      this.writable = new global.WritableStream();
    }
  };
}

// Text encoding/decoding streams
if (typeof global.TextEncoderStream === 'undefined') {
  global.TextEncoderStream = class TextEncoderStream {
    constructor() {
      this.readable = new global.ReadableStream();
      this.writable = new global.WritableStream();
      this.encoding = 'utf-8';
    }
  };
}

if (typeof global.TextDecoderStream === 'undefined') {
  global.TextDecoderStream = class TextDecoderStream {
    constructor(encoding = 'utf-8') {
      this.readable = new global.ReadableStream();
      this.writable = new global.WritableStream();
      this.encoding = encoding;
    }
  };
}

// Compression streams
if (typeof global.CompressionStream === 'undefined') {
  global.CompressionStream = class CompressionStream {
    constructor(format) {
      this.readable = new global.ReadableStream();
      this.writable = new global.WritableStream();
      this.format = format;
    }
  };
}

if (typeof global.DecompressionStream === 'undefined') {
  global.DecompressionStream = class DecompressionStream {
    constructor(format) {
      this.readable = new global.ReadableStream();
      this.writable = new global.WritableStream();
      this.format = format;
    }
  };
}

// Performance API polyfill
if (typeof global.performance === 'undefined' || !global.performance.getEntriesByName) {
  const { performance: nodePerformance } = require('perf_hooks');
  
  global.performance = {
    // Use Node.js performance.now() if available, otherwise Date.now()
    now: nodePerformance?.now ? nodePerformance.now.bind(nodePerformance) : () => Date.now(),
    
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
    
    // Additional properties
    timeOrigin: Date.now(),
    
    // Observer API mock
    PerformanceObserver: class PerformanceObserver {
      constructor(callback) {
        this.callback = callback;
      }
      
      observe() {}
      disconnect() {}
      takeRecords() { return []; }
    }
  };
}

// Crypto API polyfill
if (typeof global.crypto === 'undefined') {
  const crypto = require('crypto');
  
  global.crypto = {
    getRandomValues: (array) => {
      const buffer = crypto.randomBytes(array.length);
      for (let i = 0; i < array.length; i++) {
        array[i] = buffer[i];
      }
      return array;
    },
    
    randomUUID: crypto.randomUUID || (() => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }),
    
    subtle: {
      digest: async (algorithm, data) => {
        const hash = crypto.createHash(algorithm.toLowerCase().replace('-', ''));
        hash.update(data);
        return hash.digest();
      },
      
      encrypt: async () => { throw new Error('Not implemented in test environment'); },
      decrypt: async () => { throw new Error('Not implemented in test environment'); },
      sign: async () => { throw new Error('Not implemented in test environment'); },
      verify: async () => { throw new Error('Not implemented in test environment'); },
      generateKey: async () => { throw new Error('Not implemented in test environment'); },
      importKey: async () => { throw new Error('Not implemented in test environment'); },
      exportKey: async () => { throw new Error('Not implemented in test environment'); },
      deriveBits: async () => { throw new Error('Not implemented in test environment'); },
      deriveKey: async () => { throw new Error('Not implemented in test environment'); },
    }
  };
}

// URL API polyfill (if needed)
if (typeof global.URL === 'undefined') {
  global.URL = require('url').URL;
}

if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = require('url').URLSearchParams;
}

// Fetch API polyfill (if not already available)
if (typeof global.fetch === 'undefined') {
  try {
    // Try to use node-fetch if available
    const fetch = require('node-fetch');
    global.fetch = fetch.default || fetch;
    global.Request = fetch.Request;
    global.Response = fetch.Response;
    global.Headers = fetch.Headers;
  } catch (error) {
    // Fallback to basic mock if node-fetch is not available
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
      })
    );
    
    global.Request = jest.fn();
    global.Response = jest.fn();
    global.Headers = jest.fn();
  }
}

// FormData polyfill (if needed)
if (typeof global.FormData === 'undefined') {
  try {
    global.FormData = require('form-data');
  } catch (error) {
    // Basic mock FormData
    global.FormData = class FormData {
      constructor() {
        this._data = new Map();
      }
      
      append(key, value) {
        this._data.set(key, value);
      }
      
      get(key) {
        return this._data.get(key);
      }
      
      has(key) {
        return this._data.has(key);
      }
      
      delete(key) {
        this._data.delete(key);
      }
      
      entries() {
        return this._data.entries();
      }
    };
  }
}

// File and Blob APIs
if (typeof global.File === 'undefined') {
  global.File = class File {
    constructor(bits, name, options = {}) {
      this.name = name;
      this.size = bits.reduce((acc, bit) => acc + (bit.length || bit.byteLength || 0), 0);
      this.type = options.type || '';
      this.lastModified = options.lastModified || Date.now();
      this._bits = bits;
    }
    
    stream() {
      return new global.ReadableStream();
    }
    
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(this.size));
    }
    
    text() {
      return Promise.resolve(this._bits.join(''));
    }
  };
}

if (typeof global.Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(parts = [], options = {}) {
      this.size = parts.reduce((acc, part) => acc + (part.length || part.byteLength || 0), 0);
      this.type = options.type || '';
      this._parts = parts;
    }
    
    stream() {
      return new global.ReadableStream();
    }
    
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(this.size));
    }
    
    text() {
      return Promise.resolve(this._parts.join(''));
    }
  };
}

// Console polyfills for any missing methods
if (typeof console !== 'undefined') {
  ['debug', 'info', 'warn', 'error', 'log', 'trace', 'group', 'groupEnd', 'time', 'timeEnd'].forEach(method => {
    if (typeof console[method] === 'undefined') {
      console[method] = () => {};
    }
  });
}

// AbortController and AbortSignal
if (typeof global.AbortController === 'undefined') {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = new global.AbortSignal();
    }
    
    abort() {
      this.signal.aborted = true;
      if (this.signal.onabort) {
        this.signal.onabort();
      }
    }
  };
  
  global.AbortSignal = class AbortSignal {
    constructor() {
      this.aborted = false;
      this.onabort = null;
    }
    
    addEventListener(type, listener) {
      if (type === 'abort') {
        this.onabort = listener;
      }
    }
    
    removeEventListener() {
      this.onabort = null;
    }
  };
}

// MessageChannel and MessagePort
if (typeof global.MessageChannel === 'undefined') {
  global.MessageChannel = class MessageChannel {
    constructor() {
      this.port1 = new global.MessagePort();
      this.port2 = new global.MessagePort();
    }
  };
  
  global.MessagePort = class MessagePort {
    constructor() {
      this.onmessage = null;
    }
    
    postMessage(data) {
      if (this.onmessage) {
        setTimeout(() => this.onmessage({ data }), 0);
      }
    }
    
    addEventListener(type, listener) {
      if (type === 'message') {
        this.onmessage = listener;
      }
    }
    
    removeEventListener() {
      this.onmessage = null;
    }
    
    start() {}
    close() {}
  };
}

module.exports = {}; 