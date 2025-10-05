/**
 * Request Validation Utility
 * 
 * Provides comprehensive validation for incoming requests
 * including payload structure, data types, and content validation.
 * 
 * @author AlwariDev
 * @version 1.0.0
 */

class RequestValidator {
    constructor() {
        this.requiredFields = ['firebaseConfig', 'token', 'title', 'body'];
    }

    /**
     * Validate request payload structure and types
     * @param {Object} payload - Request payload to validate
     * @returns {Object} Validation result with success flag and errors
     */
    validatePayload(payload) {
        const errors = [];

        // Check if payload exists
        if (!payload || typeof payload !== 'object') {
            return {
                isValid: false,
                errors: ['Request payload must be a valid JSON object']
            };
        }

        // Check required fields
        const missingFields = this.requiredFields.filter(field => !payload[field]);
        if (missingFields.length > 0) {
            errors.push(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate field types
        this.requiredFields.forEach(field => {
            if (payload[field] && typeof payload[field] !== 'string') {
                errors.push(`Field '${field}' must be a string`);
            }
        });

        // Validate field lengths
        if (payload.title && payload.title.length > 100) {
            errors.push('Title must be 100 characters or less');
        }

        if (payload.body && payload.body.length > 1000) {
            errors.push('Body must be 1000 characters or less');
        }

        if (payload.token && payload.token.length < 10) {
            errors.push('FCM token appears to be invalid (too short)');
        }

        if (payload.firebaseConfig && payload.firebaseConfig.length < 50) {
            errors.push('Firebase config appears to be invalid (too short)');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate Firebase service account structure
     * @param {Object} serviceAccount - Decrypted service account object
     * @returns {Object} Validation result
     */
    validateServiceAccount(serviceAccount) {
        const errors = [];
        const requiredFields = ['project_id', 'private_key', 'client_email', 'type'];

        if (!serviceAccount || typeof serviceAccount !== 'object') {
            return {
                isValid: false,
                errors: ['Service account must be a valid object']
            };
        }

        // Check required fields
        requiredFields.forEach(field => {
            if (!serviceAccount[field]) {
                errors.push(`Missing required service account field: ${field}`);
            }
        });

        // Validate service account type
        if (serviceAccount.type && serviceAccount.type !== 'service_account') {
            errors.push('Invalid service account type');
        }

        // Validate private key format
        if (serviceAccount.private_key && 
            !serviceAccount.private_key.includes('BEGIN PRIVATE KEY')) {
            errors.push('Invalid private key format');
        }

        // Validate email format
        if (serviceAccount.client_email && 
            !this._isValidEmail(serviceAccount.client_email)) {
            errors.push('Invalid client email format');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate HTTP method and endpoint
     * @param {string} method - HTTP method
     * @param {string} path - Request path
     * @returns {Object} Validation result
     */
    validateEndpoint(method, path) {
        if (method !== 'POST') {
            return {
                isValid: false,
                error: `Method ${method} not allowed. Use POST only.`,
                statusCode: 405
            };
        }

        if (path !== '/sendNotification') {
            return {
                isValid: false,
                error: 'Not Found. Use POST /sendNotification',
                statusCode: 404
            };
        }

        return { isValid: true };
    }

    /**
     * Sanitize and prepare payload for processing
     * @param {Object} payload - Raw payload
     * @returns {Object} Sanitized payload
     */
    sanitizePayload(payload) {
        return {
            firebaseConfig: this._sanitizeString(payload.firebaseConfig),
            token: this._sanitizeString(payload.token),
            title: this._sanitizeString(payload.title),
            body: this._sanitizeString(payload.body)
        };
    }

    /**
     * Validate email format
     * @private
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email format
     */
    _isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Sanitize string input
     * @private
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    _sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str.trim();
    }
}

module.exports = new RequestValidator();
