/**
 * Enhanced Logger Utility
 * 
 * Provides structured logging with different levels and timestamps
 * for the Firebase Notification Handler service.
 * 
 * @author AlwariDev
 * @version 1.0.0
 */

class Logger {
    constructor(level = 'info') {
        this.level = level;
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    /**
     * Get current timestamp in ISO format
     * @private
     * @returns {string} Formatted timestamp
     */
    _getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Format log message with timestamp and level
     * @private
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     * @returns {string} Formatted log message
     */
    _formatMessage(level, message, meta = {}) {
        const timestamp = this._getTimestamp();
        const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    /**
     * Check if message should be logged based on current level
     * @private
     * @param {string} messageLevel - Level of the message
     * @returns {boolean} True if message should be logged
     */
    _shouldLog(messageLevel) {
        return this.levels[messageLevel] <= this.levels[this.level];
    }

    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Object} meta - Additional metadata
     */
    error(message, meta = {}) {
        if (this._shouldLog('error')) {
            console.error(`❌ ${this._formatMessage('error', message, meta)}`);
        }
    }

    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {Object} meta - Additional metadata
     */
    warn(message, meta = {}) {
        if (this._shouldLog('warn')) {
            console.warn(`⚠️  ${this._formatMessage('warn', message, meta)}`);
        }
    }

    /**
     * Log info message
     * @param {string} message - Info message
     * @param {Object} meta - Additional metadata
     */
    info(message, meta = {}) {
        if (this._shouldLog('info')) {
            console.log(`ℹ️  ${this._formatMessage('info', message, meta)}`);
        }
    }

    /**
     * Log debug message
     * @param {string} message - Debug message
     * @param {Object} meta - Additional metadata
     */
    debug(message, meta = {}) {
        if (this._shouldLog('debug')) {
            console.log(`🐛 ${this._formatMessage('debug', message, meta)}`);
        }
    }

    /**
     * Log success message
     * @param {string} message - Success message
     * @param {Object} meta - Additional metadata
     */
    success(message, meta = {}) {
        if (this._shouldLog('info')) {
            console.log(`✅ ${this._formatMessage('info', message, meta)}`);
        }
    }

    /**
     * Log server startup message
     * @param {number} port - Server port
     */
    startup(port) {
        console.log('🚀 Firebase Notification Relay Server Started');
        console.log(`📡 Server listening on port ${port}`);
        console.log(`🌐 Endpoint: http://localhost:${port}/sendNotification`);
        console.log('📋 Requirements:');
        console.log('   - POST requests only');
        console.log('   - Content-Type: application/json');
        console.log('   - Required fields: firebaseConfig, token, title, body');
        console.log('⚡ Server is stateless - no credentials are stored');
    }

    /**
     * Set log level
     * @param {string} level - New log level
     */
    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.level = level;
        }
    }
}

module.exports = new Logger();
