import pino from 'pino';
import fs from 'fs';
import path from 'path';

const environment = process.env.NODE_ENV || 'development';
const isDevelopment = environment !== 'production';

// Map NODE_ENV to shorter directory names
const envDirMap: Record<string, string> = {
  development: 'dev',
  production: 'prod',
  test: 'test',
};
const logDirName = envDirMap[environment] || environment;

// Create log directory structure: logs/<dev|prod|test>/
const logDir = path.join(process.cwd(), 'logs', logDirName);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// File paths for different log levels
const errorLogPath = path.join(logDir, 'error.log');
const warnLogPath = path.join(logDir, 'warn.log');
const combinedLogPath = path.join(logDir, 'combined.log');

/**
 * Multi-streaming logger configuration
 * Logs go to both stdout (for Docker/console) and files (for persistence)
 */

// Create streams for different log levels
const streams: pino.StreamEntry[] = [
  // Stream 1: Stdout (console) - all levels
  {
    level: isDevelopment ? 'debug' : 'info',
    stream: isDevelopment
      ? // Development: Pretty-printed with colors
        pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        })
      : // Production: JSON to stdout
        process.stdout,
  },
];

// Stream 2: Error file - errors and fatal only
streams.push({
  level: 'error',
  stream: fs.createWriteStream(errorLogPath, { flags: 'a' }),
});

// Stream 3: Warning file - warnings and above
streams.push({
  level: 'warn',
  stream: fs.createWriteStream(warnLogPath, { flags: 'a' }),
});

// Stream 4: Combined file - info and above (optional, only in production)
if (!isDevelopment) {
  streams.push({
    level: 'info',
    stream: fs.createWriteStream(combinedLogPath, { flags: 'a' }),
  });
}

// Create multi-stream logger
const logger = pino(
  {
    level: isDevelopment ? 'debug' : 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    base: {
      env: environment,
      service: 'hauspet-api',
    },
  },
  pino.multistream(streams)
);

export default logger;
