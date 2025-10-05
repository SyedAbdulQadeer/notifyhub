/**
 * AES Encryption/Decryption Utility
 * 
 * Provides AES-256-CBC encryption and decryption functionality
 * with consistent IV and key handling for Firebase service account data.
 * 
 * @author AlwariDev
 * @version 1.0.0
 */

const crypto = require('crypto');

class CryptoManager {
    constructor() {
        this.algorithm = 'aes-256-cbc';
        this.ivLength = 16;
    }

    /**
     * Generate a SHA-256 hash of the provided key
     * @private
     * @param {string} key - Original key
     * @returns {Buffer} Hashed key buffer
     */
    _generateKeyHash(key) {
        return crypto.createHash('sha256').update(key).digest();
    }

    /**
     * Create initialization vector (16 zero bytes as per specification)
     * @private
     * @returns {Buffer} IV buffer
     */
    _createIV() {
        return Buffer.alloc(this.ivLength, 0);
    }

    /**
     * Encrypt data using AES-256-CBC
     * @param {Object|string} data - Data to encrypt
     * @param {string} key - Encryption key
     * @returns {string} Base64 encoded encrypted data
     * @throws {Error} If encryption fails
     */
    encrypt(data, key) {
        try {
            const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
            const keyHash = this._generateKeyHash(key);
            const iv = this._createIV();
            
            const cipher = crypto.createCipheriv(this.algorithm, keyHash, iv);
            
            let encrypted = cipher.update(jsonString, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            
            return encrypted;
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * Decrypt AES-256-CBC encrypted data
     * @param {string} encryptedData - Base64 encoded encrypted data
     * @param {string} key - Decryption key
     * @returns {Object} Parsed JSON object from decrypted data
     * @throws {Error} If decryption fails
     */
    decrypt(encryptedData, key) {
        try {
            // Convert Base64 string to buffer
            const encryptedBuffer = Buffer.from(encryptedData, 'base64');
            
            // Generate key hash and IV
            const keyHash = this._generateKeyHash(key);
            const iv = this._createIV();
            
            // Create decipher
            const decipher = crypto.createDecipheriv(this.algorithm, keyHash, iv);
            
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
     * Validate encrypted data format
     * @param {string} encryptedData - Encrypted data to validate
     * @returns {boolean} True if valid Base64 format
     */
    isValidEncryptedFormat(encryptedData) {
        try {
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            return typeof encryptedData === 'string' && 
                   base64Regex.test(encryptedData) && 
                   encryptedData.length > 0;
        } catch {
            return false;
        }
    }
}

module.exports = new CryptoManager();
