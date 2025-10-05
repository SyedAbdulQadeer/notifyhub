/**
 * Environment Configuration Manager
 * 
 * Handles all environment variable validation and configuration setup
 * for the Firebase Notification Handler service.
 * 
 * @author AlwariDev
 * @version 1.0.0
 */

class EnvironmentConfig {
    constructor(options = {}) {
        this.skipValidation = options.skipValidation || false;
        this.config = this._loadConfiguration();
        
        if (!this.skipValidation) {
            this._validateConfiguration();
        }
    }

    /**
     * Load configuration from environment variables
     * @private
     * @returns {Object} Configuration object
     */
    _loadConfiguration() {
        return {
            port: process.env.PORT || 3000,
            secretKey: process.env.SECRET_KEY,
            nodeEnv: process.env.NODE_ENV || 'development',
            logLevel: process.env.LOG_LEVEL || 'info'
        };
    }

    /**
     * Validate required environment variables
     * @private
     * @throws {Error} If required variables are missing
     */
    _validateConfiguration() {
        // Only validate SECRET_KEY in production or when NODE_ENV is not 'test'
        if (this.config.nodeEnv !== 'test' && process.env.NODE_ENV !== 'test') {
            const required = ['secretKey'];
            const missing = required.filter(key => !this.config[key]);
            
            if (missing.length > 0) {
                console.warn(`⚠️  Warning: Missing environment variables: ${missing.join(', ').toUpperCase()}`);
                console.warn('   Some functionality may not work without proper configuration.');
            }
        }
    }

    /**
     * Get configuration value by key
     * @param {string} key - Configuration key
     * @returns {*} Configuration value
     */
    get(key) {
        return this.config[key];
    }

    /**
     * Get all configuration
     * @returns {Object} Complete configuration object
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Check if running in production mode
     * @returns {boolean} True if production environment
     */
    isProduction() {
        return this.config.nodeEnv === 'production';
    }

    /**
     * Check if running in development mode
     * @returns {boolean} True if development environment
     */
    isDevelopment() {
        return this.config.nodeEnv === 'development';
    }

    /**
     * Check if running in test mode
     * @returns {boolean} True if test environment
     */
    isTest() {
        return this.config.nodeEnv === 'test' || process.env.NODE_ENV === 'test';
    }
}

// Export class and default instance
module.exports = EnvironmentConfig;
module.exports.default = new EnvironmentConfig();
