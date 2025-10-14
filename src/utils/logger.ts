/**
 * Production-safe logger utility
 * Automatically disables console logs in production builds
 */

const IS_DEV = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (IS_DEV) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (IS_DEV) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  debug: (...args: any[]) => {
    if (IS_DEV) {
      console.debug(...args);
    }
  },
};

// For easy migration
export default logger;
