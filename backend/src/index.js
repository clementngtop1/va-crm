const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { logger, httpLogger, errorLogger } = require('./lib/logger');
const { metricsMiddleware, metricsEndpoint } = require('./lib/monitoring');

const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollments');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 8080; // Default 8080 for Railway, change if needed

// List of allowed origins (add your live domains as needed)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
  'https://va-crm-production.up.railway.app',
  'https://va-crm-frontend-production.up.railway.app'
];

// Dynamic CORS setup with Railway domain pattern support
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check for Railway domain pattern
    if (origin.match(/.*\.railway\.app$/) || 
        origin.match(/.*\.up\.railway\.app$/)) {
      return callback(null, true);
    }
    
    // Check for custom domain if set in environment
    const customDomain = process.env.CUSTOM_DOMAIN;
    if (customDomain && origin === customDomain) {
      return callback(null, true);
    }
    
    // Not allowed
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight requests for 10 minutes
}));

// Security middleware
app.use(helmet());

// Logging and monitoring middleware
app.use(httpLogger);
app.use(metricsMiddleware);

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/*
// Root route - simple test for this action
app.get('/', (req, res) => {
  res.json({ 
    message: 'VA CRM API',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});
*/

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

// Metrics endpoint (protected by basic auth in production)
if (process.env.NODE_ENV === 'production') {
  app.use('/metrics', (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || auth !== `Basic ${Buffer.from(process.env.METRICS_AUTH || 'admin:admin').toString('base64')}`) {
      res.set('WWW-Authenticate', 'Basic realm="Metrics"');
      return res.status(401).send('Authentication required');
    }
    next();
  });
}
app.get('/metrics', metricsEndpoint);

// Error logging middleware
app.use(errorLogger);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error handler caught:', { error: err });
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
