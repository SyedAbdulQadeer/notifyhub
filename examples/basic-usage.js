/**
 * Firebase Notification Handler - Basic Usage Example
 * 
 * This example demonstrates basic usage of the Firebase Notification Handler
 * library for sending notifications programmatically.
 * 
 * @author AlwariDev
 */

const FirebaseNotificationHandler = require('../index');

// Initialize the handler
const handler = new FirebaseNotificationHandler();

async function basicExample() {
    try {
        console.log('🚀 Firebase Notification Handler - Basic Example\n');

        // Example service account (replace with your real service account)
        const serviceAccount = {
            "type": "service_account",
            "project_id": "your-project-id",
            "private_key": "your-private-key",
            "client_email": "your-client-email@your-project.iam.gserviceaccount.com",
            // ... other required fields
        };

        // Secret key for encryption (use environment variable in production)
        const secretKey = process.env.SECRET_KEY || 'your-secret-key-here';

        // Encrypt the service account
        const encryptedServiceAccount = handler.encryptServiceAccount(serviceAccount, secretKey);
        console.log('✅ Service account encrypted');

        // Send a notification
        const result = await handler.sendNotification({
            encryptedServiceAccount,
            secretKey,
            token: 'recipient-fcm-token',
            title: 'Hello from AlwariDev!',
            body: 'This is a test notification from Firebase Notification Handler.'
        });

        console.log('✅ Notification sent successfully:');
        console.log('📱 Message ID:', result.messageId);
        console.log('⏱️  Duration:', result.duration);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the example
if (require.main === module) {
    basicExample();
}

module.exports = basicExample;
