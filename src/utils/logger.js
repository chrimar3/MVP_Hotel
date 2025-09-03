/**
 * Centralized logging utility for the Hotel Review Generator
 * Provides consistent logging across the application with different log levels
 * @author Hotel Review Generator Team
 * @since 2.0.0
 */

/**
 * Logger utility class for centralized logging
 * Provides methods for different log levels and can be configured for production
 */
class Logger {
  /**
   * Creates a new Logger instance
   * @param {string} context - The context/module name for the logger
   */
  constructor(context = 'App') {
    this.context = context;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Logs an info message
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   * @returns {void}
   */
  info(message, ...args) {
    if (this.isDevelopment) {
      console.log(`[${this.context}] INFO: ${message}`, ...args);
    }
  }

  /**
   * Logs a warning message
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   * @returns {void}
   */
  warn(message, ...args) {
    if (this.isDevelopment) {
      console.warn(`[${this.context}] WARN: ${message}`, ...args);
    }
  }

  /**
   * Logs an error message
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   * @returns {void}
   */
  error(message, ...args) {
    console.error(`[${this.context}] ERROR: ${message}`, ...args);
  }

  /**
   * Logs a debug message (only in development)
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   * @returns {void}
   */
  debug(message, ...args) {
    if (this.isDevelopment) {
      console.debug(`[${this.context}] DEBUG: ${message}`, ...args);
    }
  }

  /**
   * Creates a performance timer
   * @param {string} label - Label for the timer
   * @returns {function} Function to end the timer
   */
  time(label) {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      this.debug(`Timer [${label}]: ${(endTime - startTime).toFixed(2)}ms`);
    };
  }
}

/**
 * Factory function to create logger instances
 * @param {string} context - The context/module name for the logger
 * @returns {Logger} A new logger instance
 */
function createLogger(context) {
  return new Logger(context);
}

// Default logger instance
const defaultLogger = new Logger('App');

export { Logger, createLogger };
export default defaultLogger;