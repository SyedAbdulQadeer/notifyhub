/**
 * Stateless Firebase Cloud Messaging Relay Service
 * 
 * This server receives AES-encrypted Firebase service account credentials
 * from Flutter clients, decrypts them, and sends push notifications via FCM.
 * 
 * Key Features:
 * - Stateless operation (no credential storage)
 * - AES-256-CBC decryption
 * - Dynamic Firebase app initialization/cleanup
 * - Built-in HTTP module only (no Express)
 * - CORS support
 * 
 * Author: AlwariDev
 */

const http = require('http');
const crypto = require('crypto');
const url = require('url');
const admin = require('firebase-admin');
const { initializeApp, deleteApp } = require('firebase-admin/app');

// Server configuration
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

// Validate environment variables
if (!SECRET_KEY) {
    console.error('❌ ERROR: SECRET_KEY environment variable is required');
    process.exit(1);
}

console.log('🔐 Secret key loaded from environment');

/**
 * Decrypts AES-256-CBC encrypted data
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} key - Encryption key
 * @returns {Object} - Parsed JSON object from decrypted data
 */
function decryptAES(encryptedData, key) {
    try {
        // Convert Base64 string to buffer
        const encryptedBuffer = Buffer.from(encryptedData, 'base64');
        
        // Create initialization vector (16 null bytes as specified)
        const iv = Buffer.alloc(16, 0);
        
        // Create key hash for consistent key length
        const keyHash = crypto.createHash('sha256').update(key).digest();
        
        // Create decipher using AES-256-CBC algorithm with proper IV
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyHash, iv);
        
        // Decrypt the data
        let decrypted = decipher.update(encryptedBuffer, null, 'utf8');
        decrypted += decipher.final('utf8');
        
        // Parse and return JSON
        return JSON.parse(decrypted);
    } catch (error) {
        throw new Error(`Decryption failed: ${error.message}`);
    }
}

/**
 * Sends push notification using Firebase Admin SDK
 * @param {Object} serviceAccount - Firebase service account JSON
 * @param {string} token - FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @returns {Object} - Firebase response
 */
async function sendNotification(serviceAccount, token, title, body) {
    let app = null;
    
    try {
        // Generate unique app name to avoid conflicts (stateless approach)
        const appName = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        // Initialize temporary Firebase app with provided credentials
        app = initializeApp({
            credential: admin.credential.cert(serviceAccount),
        }, appName);
        
        console.log(`🔥 Firebase app initialized: ${appName}`);
        
        // Prepare notification message
        const message = {
            token: token,
            notification: {
                title: title,
                body: body
            },
            // Optional: Add data payload for custom handling
            data: {
                timestamp: Date.now().toString(),
                source: 'AlwariDev-Relay'
            }
        };
        
        // Send notification via FCM
        const response = await admin.messaging(app).send(message);
        console.log(`✅ Notification sent successfully: ${response}`);
        
        return response;
        
    } catch (error) {
        console.error(`❌ Firebase error: ${error.message}`);
        throw error;
    } finally {
        // Always cleanup: delete the temporary Firebase app to maintain stateless operation
        if (app) {
            try {
                await deleteApp(app);
                console.log('🧹 Firebase app cleaned up');
            } catch (cleanupError) {
                console.error(`⚠️ Cleanup warning: ${cleanupError.message}`);
            }
        }
    }
}

/**
 * Handles CORS preflight requests
 * @param {http.ServerResponse} res - HTTP response object
 */
function handleCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Sends JSON response
 * @param {http.ServerResponse} res - HTTP response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 */
function sendJSONResponse(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
}

/**
 * Parses request body as JSON
 * @param {http.IncomingMessage} req - HTTP request object
 * @returns {Promise<Object>} - Parsed JSON data
 */
function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                resolve(data);
            } catch (error) {
                reject(new Error('Invalid JSON in request body'));
            }
        });
        
        req.on('error', error => {
            reject(error);
        });
    });
}

/**
 * Main request handler
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 */
async function handleRequest(req, res) {
    // Set CORS headers for all responses
    handleCORS(res);
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Parse URL
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    
    // Only accept POST requests to /sendNotification
    if (req.method !== 'POST' || path !== '/sendNotification') {
        return sendJSONResponse(res, 404, {
            success: false,
            error: 'Not Found. Use POST /sendNotification'
        });
    }
    
    try {
        // Parse request body
        const requestData = await parseRequestBody(req);
        
        // Validate required fields
        const { firebaseConfig, token, title, body } = requestData;
        
        if (!firebaseConfig || !token || !title || !body) {
            return sendJSONResponse(res, 400, {
                success: false,
                error: 'Missing required fields: firebaseConfig, token, title, body'
            });
        }
        
        // Validate field types
        if (typeof firebaseConfig !== 'string' || 
            typeof token !== 'string' || 
            typeof title !== 'string' || 
            typeof body !== 'string') {
            return sendJSONResponse(res, 400, {
                success: false,
                error: 'All fields must be strings'
            });
        }
        
        console.log(`📱 Processing notification request for token: ${token.substring(0, 20)}...`);
        
        // Decrypt Firebase service account configuration
        let serviceAccount;
        try {
            serviceAccount = decryptAES(firebaseConfig, SECRET_KEY);
            console.log('🔓 Firebase config decrypted successfully');
        } catch (decryptError) {
            console.error(`🔒 Decryption failed: ${decryptError.message}`);
            return sendJSONResponse(res, 400, {
                success: false,
                error: 'Failed to decrypt Firebase configuration'
            });
        }
        
        // Validate decrypted service account structure
        if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
            return sendJSONResponse(res, 400, {
                success: false,
                error: 'Invalid Firebase service account configuration'
            });
        }
        
        // Send notification
        const firebaseResponse = await sendNotification(serviceAccount, token, title, body);
        
        // Return success response
        sendJSONResponse(res, 200, {
            success: true,
            response: firebaseResponse,
            message: 'Notification sent successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error(`💥 Server error: ${error.message}`);
        
        // Return error response
        sendJSONResponse(res, 500, {
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}

// Create HTTP server
const server = http.createServer(handleRequest);

// Start server
server.listen(PORT, () => {
    console.log('🚀 Firebase Notification Relay Server Started');
    console.log(`📡 Server listening on port ${PORT}`);
    console.log(`🌐 Endpoint: http://localhost:${PORT}/sendNotification`);
    console.log('📋 Requirements:');
    console.log('   - POST requests only');
    console.log('   - Content-Type: application/json');
    console.log('   - Required fields: firebaseConfig, token, title, body');
    console.log('');
    console.log('🧪 Test with curl:');
    console.log(`curl -X POST http://localhost:${PORT}/sendNotification \\`);
    console.log('-H "Content-Type: application/json" \\');
    console.log('-d \'{"firebaseConfig":"<encrypted_config>","token":"<fcm_token>","title":"Hello","body":"Test from AlwariDev"}\'');
    console.log('');
    console.log('⚡ Server is stateless - no credentials are stored');
});

// Graceful shutdown handling
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
