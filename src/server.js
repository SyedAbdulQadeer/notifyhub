/**
 * Firebase Notification Handler Server
 * 
 * Main server entry point for the AlwariDev Firebase Notification Handler.
 * This server provides a stateless, secure relay service for Firebase Cloud Messaging
 * with AES-256-CBC encrypted service account handling.
 * 
 * Features:
 * - Stateless operation with zero credential storage
 * - AES-256-CBC encryption/decryption
 * - Dynamic Firebase app lifecycle management
 * - Comprehensive logging and error handling
 * - Built-in HTTP module for minimal overhead
 * - CORS support for cross-origin requests
 * 
 * @author Syed Abdul Qadeer (CEO & Founder, AlwariDev)
 * @version 1.0.0
 * @license ISC
 */

const http = require('http');
const config = require('./config/environment').default;
const logger = require('./utils/logger');
const requestHandler = require('./middleware/request-handler');

class FirebaseNotificationServer {
    constructor() {
        this.server = null;
        this.port = config.get('port');
        this.isShuttingDown = false;
        
        // Initialize logger level based on environment
        logger.setLevel(config.get('logLevel'));
        
        // Validate configuration on startup
        this._validateConfiguration();
    }

    /**
     * Validate server configuration
     * @private
     */
    _validateConfiguration() {
        try {
            const requiredConfig = config.getAll();
            logger.info('Configuration validated successfully', {
                port: requiredConfig.port,
                environment: requiredConfig.nodeEnv,
                logLevel: requiredConfig.logLevel
            });
        } catch (error) {
            logger.error('Configuration validation failed', { error: error.message });
            process.exit(1);
        }
    }

    /**
     * Start the HTTP server
     */
    start() {
        try {
            // Create HTTP server with request handler
            this.server = http.createServer((req, res) => {
                requestHandler.route(req, res);
            });

            // Configure server settings
            this.server.timeout = 30000; // 30 seconds
            this.server.keepAliveTimeout = 5000; // 5 seconds
            this.server.headersTimeout = 6000; // 6 seconds

            // Start listening
            this.server.listen(this.port, () => {
                logger.startup(this.port);
                this._displayStartupInfo();
            });

            // Setup server error handling
            this.server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    logger.error(`Port ${this.port} is already in use`);
                    process.exit(1);
                } else {
                    logger.error('Server error', { error: error.message });
                }
            });

            // Setup graceful shutdown
            this._setupGracefulShutdown();

        } catch (error) {
            logger.error('Failed to start server', { error: error.message });
            process.exit(1);
        }
    }

    /**
     * Display startup information
     * @private
     */
    _displayStartupInfo() {
        console.log('');
        console.log('🧪 Test with curl:');
        console.log(`curl -X POST http://localhost:${this.port}/sendNotification \\`);
        console.log('-H "Content-Type: application/json" \\');
        console.log('-d \'{"firebaseConfig":"<encrypted_config>","token":"<fcm_token>","title":"Hello","body":"Test from AlwariDev"}\'');
        console.log('');
        console.log('📊 Health check:');
        console.log(`curl http://localhost:${this.port}/health`);
        console.log('');
        console.log('🎯 Ready to relay Firebase notifications!');
        console.log('');
    }

    /**
     * Setup graceful shutdown handlers
     * @private
     */
    _setupGracefulShutdown() {
        // Handle different shutdown signals
        const shutdownSignals = ['SIGINT', 'SIGTERM'];
        
        shutdownSignals.forEach(signal => {
            process.on(signal, () => {
                logger.info(`Received ${signal}. Initiating graceful shutdown...`);
                this._gracefulShutdown();
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception - shutting down', { 
                error: error.message, 
                stack: error.stack 
            });
            this._gracefulShutdown(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection - shutting down', { 
                reason: reason,
                promise: promise 
            });
            this._gracefulShutdown(1);
        });
    }

    /**
     * Perform graceful shutdown
     * @private
     * @param {number} exitCode - Exit code (default: 0)
     */
    _gracefulShutdown(exitCode = 0) {
        if (this.isShuttingDown) {
            logger.warn('Shutdown already in progress');
            return;
        }

        this.isShuttingDown = true;

        if (this.server) {
            // Stop accepting new connections
            this.server.close((error) => {
                if (error) {
                    logger.error('Error during server shutdown', { error: error.message });
                } else {
                    logger.info('Server closed successfully');
                }

                // Give any pending operations time to complete
                setTimeout(() => {
                    logger.info('Graceful shutdown completed');
                    process.exit(exitCode);
                }, 1000);
            });

            // Force shutdown after timeout
            setTimeout(() => {
                logger.warn('Forced shutdown after timeout');
                process.exit(1);
            }, 10000); // 10 seconds
        } else {
            process.exit(exitCode);
        }
    }

    /**
     * Get server status
     * @returns {Object} Server status information
     */
    getStatus() {
        return {
            isRunning: this.server && this.server.listening,
            port: this.port,
            environment: config.get('nodeEnv'),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '1.0.0'
        };
    }
}

// Create and start server instance
const server = new FirebaseNotificationServer();

// Start server if this file is run directly
if (require.main === module) {
    server.start();
}

// Export for testing purposes
module.exports = server;
