// Web Vitals for performance monitoring
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

class Monitoring {
  constructor() {
    this.queue = [];
    this.initialized = false;
    this.config = {
      sampleRate: 1.0, // 100% of users
      apiEndpoint: import.meta.env.VITE_API_URL || '',
      environment: import.meta.env.NODE_ENV,
    };
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Initialize error tracking
    this.setupErrorTracking();
    
    // Initialize performance monitoring
    this.measureWebVitals();
    
    // Initialize network request tracking
    this.trackNetworkRequests();

    // Flush metrics periodically
    setInterval(() => this.flushMetrics(), 30000);
  }

  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.trackError('uncaught_error', {
        message: event.error?.message || 'Unknown error',
        stack: event.error?.stack,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('unhandled_promise', {
        message: event.reason?.message || 'Unhandled Promise rejection',
        stack: event.reason?.stack,
      });
    });
  }

  measureWebVitals() {
    onCLS((metric) => this.trackPerformance('CLS', metric));
    onFID((metric) => this.trackPerformance('FID', metric));
    onLCP((metric) => this.trackPerformance('LCP', metric));
    onFCP((metric) => this.trackPerformance('FCP', metric));
    onTTFB((metric) => this.trackPerformance('TTFB', metric));
  }

  trackNetworkRequests() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        this.trackNetwork('fetch', {
          url: args[0],
          duration: performance.now() - startTime,
          status: response.status,
          success: response.ok,
        });
        return response;
      } catch (error) {
        this.trackNetwork('fetch', {
          url: args[0],
          duration: performance.now() - startTime,
          error: error.message,
          success: false,
        });
        throw error;
      }
    };
  }

  trackError(type, error) {
    const metric = {
      type: 'error',
      errorType: type,
      timestamp: Date.now(),
      ...error,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    this.queue.push(metric);
    
    // Flush immediately for errors
    this.flushMetrics();
  }

  trackPerformance(name, metric) {
    this.queue.push({
      type: 'performance',
      name,
      value: metric.value,
      timestamp: Date.now(),
      ...metric,
    });
  }

  trackNetwork(type, data) {
    this.queue.push({
      type: 'network',
      networkType: type,
      timestamp: Date.now(),
      ...data,
    });
  }

  trackUserInteraction(action, data = {}) {
    this.queue.push({
      type: 'interaction',
      action,
      timestamp: Date.now(),
      path: window.location.pathname,
      ...data,
    });
  }

  async flushMetrics() {
    if (!this.queue.length) return;

    const metrics = [...this.queue];
    this.queue = [];

    try {
      const endpoint = `${this.config.apiEndpoint}/api/metrics`;
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          environment: this.config.environment,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
      // Re-queue failed metrics
      this.queue.push(...metrics);
    }
  }
}

export const monitoring = new Monitoring();