/**
 * HTTP Utilities
 * 
 * Provides HTTP-related utility functions including CORS handling,
 * request parsing, and response formatting.
 * 
 * @author AlwariDev
 * @version 1.0.0
 */

const url = require('url');
const logger = require('./logger');

class HttpUtils {
    constructor() {
        this.corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400' // 24 hours
        };
    }

    /**
     * Set CORS headers on response
     * @param {http.ServerResponse} res - HTTP response object
     */
    setCORSHeaders(res) {
        Object.entries(this.corsHeaders).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
    }

    /**
     * Handle CORS preflight OPTIONS request
     * @param {http.ServerResponse} res - HTTP response object
     */
    handleCORSPreflight(res) {
        this.setCORSHeaders(res);
        res.writeHead(200);
        res.end();
        logger.debug('CORS preflight request handled');
    }

    /**
     * Parse request URL and extract components
     * @param {string} requestUrl - Request URL
     * @returns {Object} Parsed URL components
     */
    parseRequestUrl(requestUrl) {
        const parsedUrl = url.parse(requestUrl, true);
        return {
            pathname: parsedUrl.pathname,
            query: parsedUrl.query,
            search: parsedUrl.search
        };
    }

    /**
     * Parse request body as JSON
     * @param {http.IncomingMessage} req - HTTP request object
     * @returns {Promise<Object>} Parsed JSON data
     * @throws {Error} If parsing fails
     */
    parseRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            let size = 0;
            const maxSize = 1024 * 1024; // 1MB limit
            
            req.on('data', chunk => {
                size += chunk.length;
                
                // Prevent large payloads
                if (size > maxSize) {
                    reject(new Error('Request payload too large'));
                    return;
                }
                
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    if (body.length === 0) {
                        reject(new Error('Empty request body'));
                        return;
                    }
                    
                    const data = JSON.parse(body);
                    logger.debug('Request body parsed successfully', {
                        size: `${size} bytes`,
                        fields: Object.keys(data).length
                    });
                    resolve(data);
                } catch (error) {
                    logger.error('JSON parsing failed', { error: error.message });
                    reject(new Error('Invalid JSON in request body'));
                }
            });
            
            req.on('error', error => {
                logger.error('Request body parsing error', { error: error.message });
                reject(error);
            });
            
            // Set timeout for request parsing
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, 30000); // 30 seconds
            
            req.on('end', () => clearTimeout(timeout));
            req.on('error', () => clearTimeout(timeout));
        });
    }

    /**
     * Send JSON response with proper headers
     * @param {http.ServerResponse} res - HTTP response object
     * @param {number} statusCode - HTTP status code
     * @param {Object} data - Response data
     */
    sendJSONResponse(res, statusCode, data) {
        try {
            this.setCORSHeaders(res);
            
            const responseBody = JSON.stringify(data, null, 2);
            
            res.writeHead(statusCode, {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(responseBody)
            });
            
            res.end(responseBody);
            
            logger.debug('JSON response sent', {
                statusCode,
                responseSize: `${Buffer.byteLength(responseBody)} bytes`
            });
            
        } catch (error) {
            logger.error('Failed to send JSON response', { error: error.message });
            // Fallback response
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    }

    /**
     * Send success response with standardized format
     * @param {http.ServerResponse} res - HTTP response object
     * @param {Object} data - Success data
     * @param {string} message - Success message
     */
    sendSuccessResponse(res, data, message = 'Success') {
        this.sendJSONResponse(res, 200, {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
            service: 'AlwariDev Firebase Notification Handler'
        });
    }

    /**
     * Send error response with standardized format
     * @param {http.ServerResponse} res - HTTP response object
     * @param {number} statusCode - HTTP status code
     * @param {string} error - Error message
     * @param {Object} details - Additional error details
     */
    sendErrorResponse(res, statusCode, error, details = {}) {
        this.sendJSONResponse(res, statusCode, {
            success: false,
            error,
            details,
            timestamp: new Date().toISOString(),
            service: 'AlwariDev Firebase Notification Handler'
        });
    }

    /**
     * Extract client IP address from request
     * @param {http.IncomingMessage} req - HTTP request object
     * @returns {string} Client IP address
     */
    getClientIP(req) {
        return req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               'unknown';
    }

    /**
     * Get request user agent
     * @param {http.IncomingMessage} req - HTTP request object
     * @returns {string} User agent string
     */
    getUserAgent(req) {
        return req.headers['user-agent'] || 'unknown';
    }

    /**
     * Log request details
     * @param {http.IncomingMessage} req - HTTP request object
     */
    logRequest(req) {
        const { pathname } = this.parseRequestUrl(req.url);
        
        logger.info('Incoming request', {
            method: req.method,
            path: pathname,
            ip: this.getClientIP(req),
            userAgent: this.getUserAgent(req),
            contentType: req.headers['content-type'] || 'none'
        });
    }
}

module.exports = new HttpUtils();
