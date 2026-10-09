import '@testing-library/jest-dom';

// Mock window.scrollTo for reader chapter navigation
Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true
});
