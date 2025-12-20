import '@testing-library/jest-dom';

// Polyfill matchMedia for jsdom
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: query.includes('dark') ? false : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  });
}

// Stub canvas.getContext for jsdom
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () =>
    ({
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      clearRect: () => {},
      fillRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      fillStyle: '',
      strokeStyle: ''
    } as unknown as CanvasRenderingContext2D);
}
