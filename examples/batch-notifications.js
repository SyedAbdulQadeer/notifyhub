/**
 * Firebase Notification Handler - Batch Notifications Example
 * 
 * This example demonstrates how to send multiple notifications
 * efficiently using the batch notification feature.
 * 
 * @author AlwariDev
 */

const FirebaseNotificationHandler = require('../index');

async function batchExample() {
    try {
        console.log('📦 Firebase Notification Handler - Batch Example\n');

        const handler = new FirebaseNotificationHandler();

        // Example service account (replace with your real service account)
        const serviceAccount = {
            "type": "service_account",
            "project_id": "your-project-id",
            "private_key": "your-private-key",
            "client_email": "your-client-email@your-project.iam.gserviceaccount.com",
            // ... other required fields
        };

        const secretKey = process.env.SECRET_KEY || 'your-secret-key-here';
        const encryptedServiceAccount = handler.encryptServiceAccount(serviceAccount, secretKey);

        // Define multiple notifications
        const notifications = [
            {
                token: 'user1-fcm-token',
                title: 'Welcome!',
                body: 'Welcome to our app!'
            },
            {
                token: 'user2-fcm-token',
                title: 'New Feature',
                body: 'Check out our new feature!'
            },
            {
                token: 'user3-fcm-token',
                title: 'Reminder',
                body: 'Don\'t forget to complete your profile.'
            }
        ];

        console.log(`📤 Sending ${notifications.length} notifications...`);

        // Send batch notifications
        const result = await handler.sendBatchNotifications({
            encryptedServiceAccount,
            secretKey,
            notifications
        });

        console.log('✅ Batch notifications completed:');
        console.log(`📊 Total: ${result.responses.length}`);
        console.log(`✅ Successful: ${result.successCount}`);
        console.log(`❌ Failed: ${result.failureCount}`);
        console.log(`⏱️  Duration: ${result.duration}`);

        // Show individual results
        result.responses.forEach((response, index) => {
            const status = response.success ? '✅' : '❌';
            console.log(`${status} Notification ${index + 1}: ${response.messageId || response.error}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the example
if (require.main === module) {
    batchExample();
}

module.exports = batchExample;
