import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  // 暂时禁用 pino-pretty 以避免与 Next.js 15 的兼容性问题
  // transport: process.env.NODE_ENV !== 'production' ? {
  //   target: 'pino-pretty',
  //   options: {
  //     colorize: true,
  //     translateTime: 'SYS:standard',
  //     ignore: 'pid,hostname',
  //     singleLine: true,
  //   },
  // } : undefined,
  ...(process.env.NODE_ENV === 'production' && {
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
});

export const createChildLogger = (name: string) => {
  return logger.child({ service: name });
};

export default logger;