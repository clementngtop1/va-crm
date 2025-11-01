const prom = require('prom-client');
const { logger } = require('./logger');

// Create a Registry to store metrics
const register = new prom.Registry();

// Add default Node.js metrics
prom.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new prom.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new prom.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const dbQueryDuration = new prom.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'success'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(dbQueryDuration);

// Middleware to track request metrics
const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationSeconds = duration[0] + duration[1] / 1e9;

    // Record metrics
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(durationSeconds);
    
    httpRequestTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .inc();

    // Log slow requests
    if (durationSeconds > 1) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: durationSeconds,
        status: res.statusCode,
      });
    }
  });

  next();
};

// Endpoint to expose metrics
const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    logger.error('Error generating metrics', { error: err });
    res.status(500).end();
  }
};

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  dbQueryDuration,
};