/**
 * Test Script for Firebase Notification Relay Server
 * 
 * This script demonstrates how to test the server with mock data.
 * In a real scenario, you would encrypt actual Firebase service account JSON.
 */

const crypto = require('crypto');

// Mock Firebase service account (for testing only)
const mockServiceAccount = {
    "type": "service_account",
    "project_id": "your-project-id",
    "private_key_id": "key-id",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
    "client_id": "123456789",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"
};

/**
 * Encrypts data using AES-256-CBC (same as server decryption)
 */
function encryptAES(data, key) {
    const iv = Buffer.alloc(16, 0); // 16 null bytes as IV
    const keyHash = crypto.createHash('sha256').update(key).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', keyHash, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

// Test encryption with mock data
const SECRET_KEY = 'test_secret_key_32_chars_long!!!';
const encryptedConfig = encryptAES(mockServiceAccount, SECRET_KEY);

console.log('🧪 Test Data Generated:');
console.log('Secret Key:', SECRET_KEY);
console.log('Encrypted Config:', encryptedConfig);
console.log('');

// Generate curl command for testing
const testPayload = {
    firebaseConfig: encryptedConfig,
    token: "mock_fcm_token_for_testing",
    title: "Test Notification",
    body: "Hello from AlwariDev test script!"
};

console.log('🚀 Test curl command:');
console.log('');
console.log('# First, set the SECRET_KEY environment variable:');
console.log(`$env:SECRET_KEY="${SECRET_KEY}"`);
console.log('');
console.log('# Then run the server:');
console.log('npm start');
console.log('');
console.log('# Finally, test with this curl command:');
console.log('curl -X POST http://localhost:3000/sendNotification \\');
console.log('-H "Content-Type: application/json" \\');
console.log(`-d '${JSON.stringify(testPayload, null, 2)}'`);
console.log('');
console.log('⚠️  Note: This uses mock Firebase credentials and will fail at the actual sending step.');
console.log('   Replace with real encrypted Firebase service account for actual testing.');
