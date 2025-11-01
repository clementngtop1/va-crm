const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;

// Custom log format for development
const devLogFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Configure logger based on environment
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    process.env.NODE_ENV === 'production'
      ? json()
      : combine(colorize(), devLogFormat)
  ),
  transports: [
    new transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
    // Production file logging
    ...(process.env.NODE_ENV === 'production'
      ? [
          new transports.File({
            filename: '/var/log/app/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new transports.File({
            filename: '/var/log/app/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  exitOnError: false,
});

// Create a middleware for HTTP request logging
const httpLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled Error', {
    error: {
      message: err.message,
      stack: err.stack,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.body,
    },
  });
  next(err);
};

module.exports = {
  logger,
  httpLogger,
  errorLogger,
};