// Detect runtime environment
const isCloudflareWorkers = typeof navigator !== 'undefined' && navigator.userAgent?.includes('Cloudflare-Workers');
const isVercelEdge = typeof (globalThis as Record<string, unknown>).EdgeRuntime !== 'undefined';
const isEdgeRuntime = isCloudflareWorkers || isVercelEdge;

// Simple logger interface, compatible with pino
interface SimpleLogger {
  info: (obj: Record<string, unknown> | string, msg?: string) => void;
  warn: (obj: Record<string, unknown> | string, msg?: string) => void;
  error: (obj: Record<string, unknown> | string, msg?: string) => void;
  debug: (obj: Record<string, unknown> | string, msg?: string) => void;
  trace: (obj: Record<string, unknown> | string, msg?: string) => void;
  fatal: (obj: Record<string, unknown> | string, msg?: string) => void;
  child: (obj: Record<string, unknown>) => SimpleLogger;
}

// Create a simple logger implementation for Edge Runtime
function createEdgeLogger(prefix = ''): SimpleLogger {
  const logWithPrefix = (level: string, obj: Record<string, unknown> | string, msg?: string) => {
    const timestamp = new Date().toISOString();
    const logObj = typeof obj === 'object' ? obj : { message: obj };
    const message = msg || logObj.message || '';
    const fullMessage = prefix ? `[${prefix}] ${message}` : message;
    
    const logData = {
      level,
      time: timestamp,
      ...logObj,
      msg: fullMessage,
    };
    
    // 使用对应的 console 方法
    switch (level) {
      case 'error':
      case 'fatal':
        console.error(JSON.stringify(logData));
        break;
      case 'warn':
        console.warn(JSON.stringify(logData));
        break;
      case 'debug':
      case 'trace':
        console.debug(JSON.stringify(logData));
        break;
      default:
        console.log(JSON.stringify(logData));
    }
  };

  return {
    info: (obj, msg) => logWithPrefix('info', obj, msg),
    warn: (obj, msg) => logWithPrefix('warn', obj, msg),
    error: (obj, msg) => logWithPrefix('error', obj, msg),
    debug: (obj, msg) => logWithPrefix('debug', obj, msg),
    trace: (obj, msg) => logWithPrefix('trace', obj, msg),
    fatal: (obj, msg) => logWithPrefix('fatal', obj, msg),
    child: (obj) => createEdgeLogger(prefix ? `${prefix}:${(obj.service as string) || 'child'}` : (obj.service as string) || 'child'),
  };
}

let logger: SimpleLogger;

if (isEdgeRuntime) {
  // Use simple logger for Edge Runtime
  logger = createEdgeLogger();
} else {
  // Use pino in Node.js environment
  const pino = require('pino');
  
  logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    ...(process.env.NODE_ENV === 'production' && {
      formatters: {
        level: (label: string) => {
          return { level: label };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    }),
  });
}

export const createChildLogger = (name: string) => {
  return logger.child({ service: name });
};

export default logger;