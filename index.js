/**
 * Firebase Notification Handler Library
 * 
 * Main library export providing programmatic access to the Firebase
 * notification relay functionality for embedded use cases.
 * 
 * @author Syed Abdul Qadeer (CEO & Founder, AlwariDev)
 * @version 1.0.0
 */

// Core services
const FirebaseNotificationService = require('./src/core/firebase-service');
const CryptoManager = require('./src/utils/crypto');
const RequestValidator = require('./src/utils/validator');
const Logger = require('./src/utils/logger');
const HttpUtils = require('./src/utils/http');
// Configuration
const EnvironmentConfig = require('./src/config/environment');

// Server class for standalone usage
const FirebaseNotificationServer = require('./src/server');

/**
 * Main library class providing all functionality
 */
class FirebaseNotificationHandler {
    constructor(options = {}) {
        this.config = options.config || EnvironmentConfig.default;
        this.logger = options.logger || Logger;
        this.crypto = options.crypto || CryptoManager;
        this.validator = options.validator || RequestValidator;
        this.firebaseService = options.firebaseService || FirebaseNotificationService;
        this.httpUtils = options.httpUtils || HttpUtils;
        
        // Set logger level if provided
        if (options.logLevel) {
            this.logger.setLevel(options.logLevel);
        }
    }

    /**
     * Send a single notification with encrypted service account
     * @param {Object} params - Notification parameters
     * @param {string} params.encryptedServiceAccount - Base64 encrypted service account JSON
     * @param {string} params.secretKey - Decryption key
     * @param {string} params.token - FCM token
     * @param {string} params.title - Notification title
     * @param {string} params.body - Notification body
     * @returns {Promise<Object>} Notification result
     */
    async sendNotification({ encryptedServiceAccount, secretKey, token, title, body }) {
        try {
            // Validate input parameters
            const validation = this.validator.validatePayload({
                firebaseConfig: encryptedServiceAccount,
                token,
                title,
                body
            });

            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Decrypt service account
            const serviceAccount = this.crypto.decrypt(encryptedServiceAccount, secretKey);

            // Validate service account
            const serviceAccountValidation = this.validator.validateServiceAccount(serviceAccount);
            if (!serviceAccountValidation.isValid) {
                throw new Error(`Invalid service account: ${serviceAccountValidation.errors.join(', ')}`);
            }

            // Send notification
            return await this.firebaseService.sendNotification(serviceAccount, token, title, body);

        } catch (error) {
            this.logger.error('Send notification failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Send multiple notifications in batch
     * @param {Object} params - Batch parameters
     * @param {string} params.encryptedServiceAccount - Base64 encrypted service account JSON
     * @param {string} params.secretKey - Decryption key
     * @param {Array} params.notifications - Array of {token, title, body} objects
     * @returns {Promise<Object>} Batch result
     */
    async sendBatchNotifications({ encryptedServiceAccount, secretKey, notifications }) {
        try {
            // Decrypt service account
            const serviceAccount = this.crypto.decrypt(encryptedServiceAccount, secretKey);

            // Validate service account
            const serviceAccountValidation = this.validator.validateServiceAccount(serviceAccount);
            if (!serviceAccountValidation.isValid) {
                throw new Error(`Invalid service account: ${serviceAccountValidation.errors.join(', ')}`);
            }

            // Send batch notifications
            return await this.firebaseService.sendBatchNotifications(serviceAccount, notifications);

        } catch (error) {
            this.logger.error('Batch notification failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Encrypt service account data
     * @param {Object} serviceAccount - Service account JSON object
     * @param {string} secretKey - Encryption key
     * @returns {string} Base64 encrypted data
     */
    encryptServiceAccount(serviceAccount, secretKey) {
        return this.crypto.encrypt(serviceAccount, secretKey);
    }

    /**
     * Decrypt service account data
     * @param {string} encryptedData - Base64 encrypted data
     * @param {string} secretKey - Decryption key
     * @returns {Object} Decrypted service account
     */
    decryptServiceAccount(encryptedData, secretKey) {
        return this.crypto.decrypt(encryptedData, secretKey);
    }

    /**
     * Validate Firebase service account structure
     * @param {Object} serviceAccount - Service account to validate
     * @returns {Object} Validation result
     */
    validateServiceAccount(serviceAccount) {
        return this.validator.validateServiceAccount(serviceAccount);
    }

    /**
     * Create and start HTTP server
     * @param {Object} options - Server options
     * @returns {FirebaseNotificationServer} Server instance
     */
    createServer(options = {}) {
        const server = new FirebaseNotificationServer();
        
        if (options.autoStart !== false) {
            server.start();
        }
        
        return server;
    }

    /**
     * Get library information
     * @returns {Object} Library information
     */
    getInfo() {
        return {
            name: 'Firebase Notification Handler',
            version: '1.0.0',
            author: 'Syed Abdul Qadeer',
            organization: 'AlwariDev',
            description: 'Stateless Firebase Cloud Messaging relay with AES encryption',
            features: [
                'Stateless operation',
                'AES-256-CBC encryption',
                'Dynamic Firebase app management',
                'Comprehensive logging',
                'HTTP server with CORS',
                'Batch notification support'
            ]
        };
    }
}

// Export individual components for advanced usage
module.exports = FirebaseNotificationHandler;
module.exports.FirebaseNotificationHandler = FirebaseNotificationHandler;
module.exports.FirebaseNotificationService = FirebaseNotificationService;
module.exports.CryptoManager = CryptoManager;
module.exports.RequestValidator = RequestValidator;
module.exports.Logger = Logger;
module.exports.HttpUtils = HttpUtils;
module.exports.EnvironmentConfig = EnvironmentConfig;
module.exports.FirebaseNotificationServer = FirebaseNotificationServer;

// Export default instance for immediate use
module.exports.default = new FirebaseNotificationHandler();
