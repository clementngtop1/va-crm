import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { monitoring } from '../utils/monitoring';

export function MonitoringProvider({ children }) {
  const location = useLocation();

  useEffect(() => {
    // Initialize monitoring on first render
    monitoring.init();
  }, []);

  useEffect(() => {
    // Track route changes
    monitoring.trackUserInteraction('page_view', {
      path: location.pathname,
      query: location.search,
    });
  }, [location]);

  return children;
}