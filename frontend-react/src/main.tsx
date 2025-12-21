import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initPerformanceMonitoring, logPerformanceMetrics, logResourceTiming } from './performance';

// Initialize performance monitoring
initPerformanceMonitoring();

// Log metrics after page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      logPerformanceMetrics();
      logResourceTiming();
    }, 3000);
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
