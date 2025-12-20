import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

export interface PerformanceMetrics {
  CLS: number | null;
  FCP: number | null;
  LCP: number | null;
  TTFB: number | null;
  INP: number | null;
}

const metrics: PerformanceMetrics = {
  CLS: null,
  FCP: null,
  LCP: null,
  TTFB: null,
  INP: null,
};

function sendToAnalytics(metric: Metric) {
  // Log to console in development
  if (import.meta.env.MODE === 'development') {
    console.log(`[Performance] ${metric.name}:`, metric.value, metric);
  }

  // Store metric
  metrics[metric.name as keyof PerformanceMetrics] = metric.value;

  // Send to analytics service (e.g., Google Analytics, Custom endpoint)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Send to custom analytics endpoint
  if (import.meta.env.MODE === 'production') {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        id: metric.id,
        timestamp: Date.now(),
      }),
    }).catch((err) => console.error('Failed to send analytics:', err));
  }
}

export function initPerformanceMonitoring() {
  // Core Web Vitals
  onCLS(sendToAnalytics); // Cumulative Layout Shift
  onFCP(sendToAnalytics); // First Contentful Paint
  onLCP(sendToAnalytics); // Largest Contentful Paint
  onTTFB(sendToAnalytics); // Time to First Byte
  onINP(sendToAnalytics); // Interaction to Next Paint

  // Log initial page load performance
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        console.log('[Performance] Page Load Metrics:', {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          domInteractive: perfData.domInteractive,
          totalLoadTime: perfData.loadEventEnd - perfData.fetchStart,
        });
      }
    });
  }
}

export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...metrics };
}

export function logPerformanceMetrics() {
  const currentMetrics = getPerformanceMetrics();
  
  console.group('📊 Web Vitals Performance Metrics');
  console.log('CLS (Cumulative Layout Shift):', currentMetrics.CLS?.toFixed(3) || 'N/A', '(Good: < 0.1)');
  console.log('FCP (First Contentful Paint):', currentMetrics.FCP?.toFixed(0) || 'N/A', 'ms (Good: < 1800ms)');
  console.log('LCP (Largest Contentful Paint):', currentMetrics.LCP?.toFixed(0) || 'N/A', 'ms (Good: < 2500ms)');
  console.log('TTFB (Time to First Byte):', currentMetrics.TTFB?.toFixed(0) || 'N/A', 'ms (Good: < 800ms)');
  console.log('INP (Interaction to Next Paint):', currentMetrics.INP?.toFixed(0) || 'N/A', 'ms (Good: < 200ms)');
  console.groupEnd();

  // Performance score calculation
  const score = calculatePerformanceScore(currentMetrics);
  console.log(`🎯 Overall Performance Score: ${score}/100`);
  
  return currentMetrics;
}

function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100;
  
  // CLS: Good < 0.1, Poor > 0.25
  if (metrics.CLS !== null) {
    if (metrics.CLS > 0.25) score -= 20;
    else if (metrics.CLS > 0.1) score -= 10;
  }
  
  // LCP: Good < 2500ms, Poor > 4000ms
  if (metrics.LCP !== null) {
    if (metrics.LCP > 4000) score -= 20;
    else if (metrics.LCP > 2500) score -= 10;
  }
  
  // TTFB: Good < 800ms, Poor > 1800ms
  if (metrics.TTFB !== null) {
    if (metrics.TTFB > 1800) score -= 20;
    else if (metrics.TTFB > 800) score -= 10;
  }

  // INP: Good < 200ms, Poor > 500ms
  if (metrics.INP !== null) {
    if (metrics.INP > 500) score -= 20;
    else if (metrics.INP > 200) score -= 10;
  }
  
  return Math.max(0, score);
}

// Resource timing monitoring
export function logResourceTiming() {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const byType = resources.reduce((acc, resource) => {
    const type = resource.initiatorType;
    if (!acc[type]) acc[type] = [];
    acc[type].push({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize,
    });
    return acc;
  }, {} as Record<string, any[]>);

  console.group('📦 Resource Loading Performance');
  Object.entries(byType).forEach(([type, items]) => {
    const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);
    const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
    console.log(`${type}: ${items.length} items, ${totalDuration.toFixed(0)}ms, ${(totalSize / 1024).toFixed(2)}KB`);
  });
  console.groupEnd();
}
