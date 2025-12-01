import pinoHttp from 'pino-http';
import logger from '../../logger/logger';

/**
 * HTTP request/response logging middleware using pino-http
 * Automatically logs all HTTP requests with method, URL, status code, and response time
 */
export const httpLogger = pinoHttp({
  logger,

  // Customize the log message
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    if (res.statusCode >= 300) return 'info';
    return 'info';
  },

  // Customize what gets logged
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} completed`;
  },

  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} failed: ${err.message}`;
  },

  // Serialize request - only log important fields
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      path: req.path,
      params: req.params,
      query: req.query,
      // Don't log request body by default (may contain sensitive data)
      // Uncomment if needed: body: req.raw.body,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      // Don't log response body by default (can be large)
    }),
  },

  // Don't log health check endpoints to reduce noise
  autoLogging: {
    ignore: (req) => {
      // Skip logging for health check endpoint
      return req.url === '/' && req.method === 'GET';
    },
  },
});
