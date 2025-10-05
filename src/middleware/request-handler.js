/**
 * Request Handler Middleware
 * 
 * Main request processing logic that orchestrates all components
 * to handle Firebase notification requests securely and efficiently.
 * 
 * @author AlwariDev
 * @version 1.0.0
 */

const httpUtils = require('../utils/http');
const validator = require('../utils/validator');
const crypto = require('../utils/crypto');
const firebaseService = require('../core/firebase-service');
const config = require('../config/environment').default;
const logger = require('../utils/logger');

class RequestHandler {
    constructor() {
        this.serviceName = 'AlwariDev Firebase Notification Handler';
        this.version = '1.0.0';
    }

    /**
     * Main request handler function
     * @param {http.IncomingMessage} req - HTTP request object
     * @param {http.ServerResponse} res - HTTP response object
     */
    async handleRequest(req, res) {
        const startTime = Date.now();
        
        try {
            // Log incoming request
            httpUtils.logRequest(req);
            
            // Handle CORS preflight
            if (req.method === 'OPTIONS') {
                httpUtils.handleCORSPreflight(res);
                return;
            }
            
            // Validate endpoint and method
            const { pathname } = httpUtils.parseRequestUrl(req.url);
            const endpointValidation = validator.validateEndpoint(req.method, pathname);
            
            if (!endpointValidation.isValid) {
                httpUtils.sendErrorResponse(
                    res, 
                    endpointValidation.statusCode, 
                    endpointValidation.error
                );
                return;
            }
            
            // Parse and validate request payload
            const payload = await httpUtils.parseRequestBody(req);
            const payloadValidation = validator.validatePayload(payload);
            
            if (!payloadValidation.isValid) {
                httpUtils.sendErrorResponse(res, 400, 'Validation failed', {
                    errors: payloadValidation.errors
                });
                return;
            }
            
            // Sanitize payload
            const sanitizedPayload = validator.sanitizePayload(payload);
            const { firebaseConfig, token, title, body } = sanitizedPayload;
            
            logger.info('Processing notification request', {
                tokenPreview: `${token.substring(0, 20)}...`,
                title: title,
                bodyLength: body.length
            });
            
            // Decrypt Firebase configuration
            let serviceAccount;
            try {
                serviceAccount = crypto.decrypt(firebaseConfig, config.get('secretKey'));
                logger.debug('Firebase configuration decrypted successfully');
            } catch (decryptError) {
                logger.error('Decryption failed', { error: decryptError.message });
                httpUtils.sendErrorResponse(res, 400, 'Failed to decrypt Firebase configuration', {
                    hint: 'Verify that the encryption key matches and the data is properly encrypted'
                });
                return;
            }
            
            // Validate decrypted service account
            const serviceAccountValidation = validator.validateServiceAccount(serviceAccount);
            if (!serviceAccountValidation.isValid) {
                httpUtils.sendErrorResponse(res, 400, 'Invalid Firebase service account', {
                    errors: serviceAccountValidation.errors
                });
                return;
            }
            
            // Send notification via Firebase
            const notificationResult = await firebaseService.sendNotification(
                serviceAccount, 
                token, 
                title, 
                body
            );
            
            const totalDuration = Date.now() - startTime;
            
            // Send success response
            httpUtils.sendSuccessResponse(res, {
                messageId: notificationResult.messageId,
                firebaseDuration: notificationResult.duration,
                totalDuration: `${totalDuration}ms`,
                service: this.serviceName,
                version: this.version
            }, 'Notification sent successfully');
            
            logger.success(`Request completed successfully in ${totalDuration}ms`, {
                messageId: notificationResult.messageId,
                totalDuration: `${totalDuration}ms`
            });
            
        } catch (error) {
            const totalDuration = Date.now() - startTime;
            
            logger.error(`Request failed after ${totalDuration}ms`, {
                error: error.message,
                stack: error.stack,
                duration: `${totalDuration}ms`
            });
            
            // Determine appropriate error response
            let statusCode = 500;
            let errorMessage = 'Internal server error';
            
            if (error.message.includes('token')) {
                statusCode = 400;
                errorMessage = error.message;
            } else if (error.message.includes('authentication')) {
                statusCode = 401;
                errorMessage = 'Firebase authentication failed';
            } else if (error.message.includes('timeout')) {
                statusCode = 408;
                errorMessage = 'Request timeout';
            }
            
            httpUtils.sendErrorResponse(res, statusCode, errorMessage, {
                duration: `${totalDuration}ms`,
                service: this.serviceName
            });
        }
    }

    /**
     * Handle health check requests
     * @param {http.IncomingMessage} req - HTTP request object
     * @param {http.ServerResponse} res - HTTP response object
     */
    handleHealthCheck(req, res) {
        httpUtils.sendSuccessResponse(res, {
            status: 'healthy',
            service: this.serviceName,
            version: this.version,
            environment: config.get('nodeEnv'),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        }, 'Service is healthy');
    }

    /**
     * Handle 404 errors for unknown endpoints
     * @param {http.IncomingMessage} req - HTTP request object
     * @param {http.ServerResponse} res - HTTP response object
     */
    handleNotFound(req, res) {
        const { pathname } = httpUtils.parseRequestUrl(req.url);
        
        httpUtils.sendErrorResponse(res, 404, 'Endpoint not found', {
            requestedPath: pathname,
            availableEndpoints: [
                'POST /sendNotification - Send notification',
                'GET /health - Health check'
            ]
        });
    }

    /**
     * Main router function
     * @param {http.IncomingMessage} req - HTTP request object
     * @param {http.ServerResponse} res - HTTP response object
     */
    async route(req, res) {
        const { pathname } = httpUtils.parseRequestUrl(req.url);
        
        try {
            switch (pathname) {
                case '/sendNotification':
                    await this.handleRequest(req, res);
                    break;
                case '/health':
                    this.handleHealthCheck(req, res);
                    break;
                default:
                    this.handleNotFound(req, res);
                    break;
            }
        } catch (error) {
            logger.error('Router error', { error: error.message, path: pathname });
            httpUtils.sendErrorResponse(res, 500, 'Internal server error');
        }
    }
}

module.exports = new RequestHandler();
