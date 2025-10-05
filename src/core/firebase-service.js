/**
 * Firebase Notification Service
 * 
 * Core service for handling Firebase Cloud Messaging operations
 * with stateless app management and secure credential handling.
 * 
 * @author AlwariDev
 * @version 1.0.0
 */

const admin = require('firebase-admin');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const logger = require('../utils/logger');

class FirebaseNotificationService {
    constructor() {
        this.appCounter = 0;
    }

    /**
     * Generate unique app name for stateless operation
     * @private
     * @returns {string} Unique app identifier
     */
    _generateAppName() {
        this.appCounter++;
        return `alwari-relay-${Date.now()}-${this.appCounter}-${Math.random().toString(36).substring(7)}`;
    }

    /**
     * Initialize temporary Firebase app with service account
     * @private
     * @param {Object} serviceAccount - Firebase service account credentials
     * @returns {admin.app.App} Initialized Firebase app instance
     * @throws {Error} If initialization fails
     */
    _initializeFirebaseApp(serviceAccount) {
        try {
            const appName = this._generateAppName();
            
            const app = initializeApp({
                credential: admin.credential.cert(serviceAccount),
            }, appName);
            
            logger.debug(`Firebase app initialized: ${appName}`, { 
                projectId: serviceAccount.project_id 
            });
            
            return app;
        } catch (error) {
            logger.error(`Firebase app initialization failed: ${error.message}`);
            throw new Error(`Failed to initialize Firebase app: ${error.message}`);
        }
    }

    /**
     * Clean up Firebase app instance
     * @private
     * @param {admin.app.App} app - Firebase app to cleanup
     */
    async _cleanupFirebaseApp(app) {
        if (!app) return;
        
        try {
            await deleteApp(app);
            logger.debug('Firebase app cleaned up successfully', { 
                appName: app.name 
            });
        } catch (error) {
            logger.warn(`Firebase app cleanup warning: ${error.message}`, { 
                appName: app.name 
            });
        }
    }

    /**
     * Build notification message object
     * @private
     * @param {string} token - FCM token
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @returns {Object} FCM message object
     */
    _buildNotificationMessage(token, title, body) {
        return {
            token: token,
            notification: {
                title: title,
                body: body
            },
            data: {
                timestamp: Date.now().toString(),
                source: 'AlwariDev-NotificationHandler',
                version: '1.0.0'
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    color: '#FF6B6B'
                }
            },
            apns: {
                payload: {
                    aps: {
                        badge: 1,
                        sound: 'default'
                    }
                }
            }
        };
    }

    /**
     * Send push notification via Firebase Cloud Messaging
     * @param {Object} serviceAccount - Firebase service account JSON
     * @param {string} token - FCM token of the recipient
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @returns {Promise<Object>} Firebase response object
     * @throws {Error} If sending fails
     */
    async sendNotification(serviceAccount, token, title, body) {
        let app = null;
        const startTime = Date.now();
        
        try {
            // Initialize temporary Firebase app
            app = this._initializeFirebaseApp(serviceAccount);
            
            // Build notification message
            const message = this._buildNotificationMessage(token, title, body);
            
            logger.info('Sending notification', {
                projectId: serviceAccount.project_id,
                tokenPreview: `${token.substring(0, 20)}...`,
                title: title
            });
            
            // Send notification via FCM
            const response = await admin.messaging(app).send(message);
            
            const duration = Date.now() - startTime;
            logger.success(`Notification sent successfully in ${duration}ms`, {
                messageId: response,
                duration: `${duration}ms`
            });
            
            return {
                messageId: response,
                success: true,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`Firebase notification failed after ${duration}ms: ${error.message}`, {
                errorCode: error.code,
                duration: `${duration}ms`,
                tokenPreview: token ? `${token.substring(0, 20)}...` : 'unknown'
            });
            
            // Provide more specific error messages
            if (error.code === 'messaging/registration-token-not-registered') {
                throw new Error('FCM token is not registered or has expired');
            } else if (error.code === 'messaging/invalid-registration-token') {
                throw new Error('FCM token format is invalid');
            } else if (error.code === 'messaging/authentication-error') {
                throw new Error('Firebase service account authentication failed');
            } else {
                throw new Error(`Firebase messaging error: ${error.message}`);
            }
            
        } finally {
            // Always cleanup the temporary Firebase app
            await this._cleanupFirebaseApp(app);
        }
    }

    /**
     * Send multiple notifications (batch operation)
     * @param {Object} serviceAccount - Firebase service account JSON
     * @param {Array} notifications - Array of {token, title, body} objects
     * @returns {Promise<Object>} Batch response with results
     */
    async sendBatchNotifications(serviceAccount, notifications) {
        let app = null;
        const startTime = Date.now();
        
        try {
            app = this._initializeFirebaseApp(serviceAccount);
            
            const messages = notifications.map(({ token, title, body }) => 
                this._buildNotificationMessage(token, title, body)
            );
            
            logger.info(`Sending batch of ${notifications.length} notifications`);
            
            const response = await admin.messaging(app).sendAll(messages);
            
            const duration = Date.now() - startTime;
            logger.success(`Batch notifications completed in ${duration}ms`, {
                total: response.responses.length,
                successful: response.successCount,
                failed: response.failureCount,
                duration: `${duration}ms`
            });
            
            return {
                ...response,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            logger.error(`Batch notification failed: ${error.message}`);
            throw error;
        } finally {
            await this._cleanupFirebaseApp(app);
        }
    }
}

module.exports = new FirebaseNotificationService();
