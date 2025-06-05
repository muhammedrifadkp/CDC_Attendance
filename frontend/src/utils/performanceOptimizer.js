/**
 * Performance Optimization Utilities
 * Provides tools for monitoring and optimizing React app performance
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceMount = now - mountTime.current;
    const timeSinceLastRender = now - lastRenderTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 ${componentName} Performance:`, {
        renderCount: renderCount.current,
        timeSinceMount: `${timeSinceMount}ms`,
        timeSinceLastRender: `${timeSinceLastRender}ms`
      });
    }
    
    lastRenderTime.current = now;
  });

  return {
    renderCount: renderCount.current,
    timeSinceMount: Date.now() - mountTime.current
  };
};

/**
 * Debounced value hook for performance optimization
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttled callback hook
 */
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

/**
 * Memoized API call hook
 */
export const useMemoizedAPI = (apiCall, dependencies = [], options = {}) => {
  const { cacheTime = 5 * 60 * 1000, enabled = true } = options;
  const cache = useRef(new Map());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cacheKey = useMemo(() => 
    JSON.stringify(dependencies), 
    [dependencies]
  );

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cached = cache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setData(cached.data);
      return cached.data;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(...dependencies);
      
      // Cache the result
      cache.current.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, cacheKey, cacheTime, enabled, dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Virtual scrolling hook for large lists
 */
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    totalHeight: visibleItems.totalHeight,
    offsetY: visibleItems.offsetY
  };
};

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current);
      }
    };
  }, [hasIntersected, options]);

  return { targetRef, isIntersecting, hasIntersected };
};

/**
 * Memory usage monitor
 */
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if (performance.memory) {
        setMemoryInfo({
          usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
          totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
          jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

/**
 * Bundle size analyzer
 */
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    console.log('📦 Bundle Analysis:');
    console.log('Scripts:', scripts.map(s => s.src));
    console.log('Styles:', styles.map(s => s.href));
    
    // Estimate bundle sizes (rough approximation)
    const estimatedJSSize = scripts.length * 50; // Rough estimate in KB
    const estimatedCSSSize = styles.length * 10; // Rough estimate in KB
    
    console.log(`Estimated JS size: ~${estimatedJSSize}KB`);
    console.log(`Estimated CSS size: ~${estimatedCSSSize}KB`);
  }
};

/**
 * Component render optimizer
 */
export const optimizeComponent = (Component, dependencies = []) => {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison logic
    for (const dep of dependencies) {
      if (prevProps[dep] !== nextProps[dep]) {
        return false;
      }
    }
    return true;
  });
};

/**
 * Performance metrics collector
 */
export const collectPerformanceMetrics = () => {
  if (typeof performance !== 'undefined') {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      // Navigation timing
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
      loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
      
      // Paint timing
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      
      // Memory (if available)
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576)
      } : null
    };
  }
  return null;
};

/**
 * Lazy load images
 */
export const useLazyImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const { targetRef, hasIntersected } = useIntersectionObserver();

  useEffect(() => {
    if (hasIntersected && src) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [hasIntersected, src]);

  return { targetRef, imageSrc, isLoaded };
};

export default {
  usePerformanceMonitor,
  useDebounce,
  useThrottle,
  useMemoizedAPI,
  useVirtualScroll,
  useIntersectionObserver,
  useMemoryMonitor,
  analyzeBundleSize,
  optimizeComponent,
  collectPerformanceMetrics,
  useLazyImage
};
