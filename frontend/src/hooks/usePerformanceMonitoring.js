import { useEffect, useRef } from 'react';
import { monitoring } from '../utils/monitoring';

export function usePerformanceMonitoring(componentName) {
  const mountTime = useRef(performance.now());
  const renderCount = useRef(0);

  useEffect(() => {
    // Track mount time
    const mountDuration = performance.now() - mountTime.current;
    monitoring.trackPerformance('component_mount', {
      component: componentName,
      duration: mountDuration,
    });

    // Track render count
    renderCount.current++;

    return () => {
      // Track unmount metrics
      monitoring.trackPerformance('component_lifecycle', {
        component: componentName,
        renders: renderCount.current,
        totalMounted: performance.now() - mountTime.current,
      });
    };
  }, [componentName]);

  // Track subsequent renders
  useEffect(() => {
    if (renderCount.current > 1) {
      monitoring.trackPerformance('component_render', {
        component: componentName,
        renderCount: renderCount.current,
      });
    }
  });
}