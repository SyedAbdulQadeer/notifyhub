/**
 * Firebase Notification Handler - Test Helper
 * 
 * This script demonstrates how to test the Firebase Notification Handler
 * with both mock and real data scenarios. It provides examples for:
 * - Encryption/decryption testing
 * - HTTP API testing
 * - Library usage examples
 * 
 * @author Syed Abdul Qadeer (CEO & Founder, AlwariDev)
 * @version 1.0.0
 */

const crypto = require('crypto');
const http = require('http');

// Import the library components for testing
const FirebaseNotificationHandler = require('../index');

class TestHelper {
    constructor() {
        // Set test environment to avoid strict validation
        process.env.NODE_ENV = 'test';
        
        this.secretKey = 'test_secret_key_32_chars_long!!!';
        this.serverPort = 3000;
        this.handler = new FirebaseNotificationHandler();
    }

    /**
     * Generate mock Firebase service account for testing
     * @returns {Object} Mock service account
     */
    getMockServiceAccount() {
        return {
            "type": "service_account",
            "project_id": "alwaridev-test-project",
            "private_key_id": "test-key-id-12345",
            "private_key": "-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY_FOR_TESTING_ONLY\n-----END PRIVATE KEY-----\n",
            "client_email": "firebase-adminsdk-test@alwaridev-test-project.iam.gserviceaccount.com",
            "client_id": "123456789012345678901",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-test%40alwaridev-test-project.iam.gserviceaccount.com"
        };
    }

    /**
     * Test encryption/decryption functionality
     */
    testEncryption() {
        console.log('🔐 Testing Encryption/Decryption...\n');
        
        try {
            const mockServiceAccount = this.getMockServiceAccount();
            
            // Test encryption
            const encrypted = this.handler.encryptServiceAccount(mockServiceAccount, this.secretKey);
            console.log('✅ Encryption successful');
            console.log(`📄 Encrypted data: ${encrypted.substring(0, 50)}...`);
            
            // Test decryption
            const decrypted = this.handler.decryptServiceAccount(encrypted, this.secretKey);
            console.log('✅ Decryption successful');
            console.log(`🔍 Project ID: ${decrypted.project_id}`);
            
            // Verify data integrity
            const isValid = decrypted.project_id === mockServiceAccount.project_id;
            console.log(`🧪 Data integrity: ${isValid ? '✅ PASS' : '❌ FAIL'}\n`);
            
            return { encrypted, decrypted };
        } catch (error) {
            console.error('❌ Encryption test failed:', error.message);
            return null;
        }
    }

    /**
     * Test service account validation
     */
    testValidation() {
        console.log('✨ Testing Validation...\n');
        
        const mockServiceAccount = this.getMockServiceAccount();
        const validation = this.handler.validateServiceAccount(mockServiceAccount);
        
        console.log(`📋 Validation result: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}`);
        
        if (!validation.isValid) {
            console.log('❌ Validation errors:');
            validation.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        console.log('');
        return validation;
    }

    /**
     * Generate test data for HTTP requests
     */
    generateTestData() {
        console.log('📊 Generating Test Data...\n');
        
        const encryptionTest = this.testEncryption();
        if (!encryptionTest) return null;
        
        const testPayload = {
            firebaseConfig: encryptionTest.encrypted,
            token: "mock_fcm_token_for_alwaridev_testing_123456789",
            title: "AlwariDev Test Notification",
            body: "🚀 Hello from Firebase Notification Handler! This is a test message from AlwariDev."
        };
        
        console.log('📋 Test payload generated:');
        console.log(`   📱 Token: ${testPayload.token.substring(0, 20)}...`);
        console.log(`   📝 Title: ${testPayload.title}`);
        console.log(`   📄 Body length: ${testPayload.body.length} characters`);
        console.log('');
        
        return testPayload;
    }

    /**
     * Generate curl command for testing
     */
    generateCurlCommand() {
        console.log('🌐 HTTP API Testing Commands...\n');
        
        const testPayload = this.generateTestData();
        if (!testPayload) return;
        
        console.log('🚀 Step-by-step testing guide:');
        console.log('');
        
        // Environment setup
        console.log('1️⃣ Set environment variable (PowerShell):');
        console.log(`   $env:SECRET_KEY="${this.secretKey}"`);
        console.log('');
        console.log('   Or (Command Prompt):');
        console.log(`   set SECRET_KEY=${this.secretKey}`);
        console.log('');
        
        // Start server
        console.log('2️⃣ Start the server:');
        console.log('   npm start');
        console.log('');
        
        // Health check
        console.log('3️⃣ Test health endpoint:');
        console.log(`   curl http://localhost:${this.serverPort}/health`);
        console.log('');
        
        // Send notification
        console.log('4️⃣ Send test notification:');
        console.log(`   curl -X POST http://localhost:${this.serverPort}/sendNotification \\`);
        console.log('   -H "Content-Type: application/json" \\');
        console.log(`   -d '${JSON.stringify(testPayload, null, 2)}'`);
        console.log('');
        
        // Alternative with file
        console.log('5️⃣ Alternative - Save payload to file and use:');
        console.log('   echo \'%PAYLOAD%\' > test-payload.json');
        console.log(`   curl -X POST http://localhost:${this.serverPort}/sendNotification \\`);
        console.log('   -H "Content-Type: application/json" \\');
        console.log('   -d @test-payload.json');
        console.log('');
    }

    /**
     * Test library usage programmatically
     */
    async testLibraryUsage() {
        console.log('📚 Testing Library Usage...\n');
        
        try {
            const mockServiceAccount = this.getMockServiceAccount();
            const encrypted = this.handler.encryptServiceAccount(mockServiceAccount, this.secretKey);
            
            console.log('🔄 Testing programmatic notification sending...');
            
            // This will fail with mock credentials, but demonstrates usage
            try {
                await this.handler.sendNotification({
                    encryptedServiceAccount: encrypted,
                    secretKey: this.secretKey,
                    token: 'mock_token_123',
                    title: 'Test Title',
                    body: 'Test Body'
                });
                console.log('✅ Notification sent successfully');
            } catch (error) {
                console.log('⚠️  Expected failure with mock credentials:', error.message);
            }
            
            console.log('');
        } catch (error) {
            console.error('❌ Library test failed:', error.message);
        }
    }

    /**
     * Display library information
     */
    showLibraryInfo() {
        console.log('ℹ️  Library Information...\n');
        
        const info = this.handler.getInfo();
        console.log(`📦 ${info.name} v${info.version}`);
        console.log(`👨‍💻 Author: ${info.author}`);
        console.log(`🏢 Organization: ${info.organization}`);
        console.log(`📝 Description: ${info.description}`);
        console.log('');
        console.log('🚀 Features:');
        info.features.forEach(feature => console.log(`   ✅ ${feature}`));
        console.log('');
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 AlwariDev Firebase Notification Handler - Test Suite\n');
        console.log('=' .repeat(60));
        console.log('');
        
        this.showLibraryInfo();
        this.testValidation();
        this.testEncryption();
        await this.testLibraryUsage();
        this.generateCurlCommand();
        
        console.log('⚠️  Important Notes:');
        console.log('   • This test uses MOCK Firebase credentials');
        console.log('   • Actual notification sending will fail without real credentials');
        console.log('   • Replace mock data with real Firebase service account for production');
        console.log('   • Ensure SECRET_KEY environment variable matches encryption key');
        console.log('');
        console.log('🎯 Test suite completed! Ready to test your Firebase notifications.');
        console.log('');
        console.log('📞 Support: https://github.com/SyedAbdulQadeer/firebase-notification-handler');
        console.log('🏢 Developed by AlwariDev - https://github.com/AlwariDev');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new TestHelper();
    tester.runAllTests();
}

module.exports = TestHelper;
