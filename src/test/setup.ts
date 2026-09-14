import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement BroadcastChannel; the realtime layer already guards for its
// absence, so tests simply run without cross-tab broadcast (no-op).
