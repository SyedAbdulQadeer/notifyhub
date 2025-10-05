/**
 * Firebase Notification Handler - HTTP Server Example
 * 
 * This example demonstrates how to create and customize
 * the HTTP server for handling notification requests.
 * 
 * @author AlwariDev
 */

const FirebaseNotificationHandler = require('../index');

async function serverExample() {
    console.log('🌐 Firebase Notification Handler - HTTP Server Example\n');

    // Create handler instance with custom configuration
    const handler = new FirebaseNotificationHandler({
        logLevel: 'debug' // Enable debug logging
    });

    // Display library information
    const info = handler.getInfo();
    console.log(`📦 ${info.name} v${info.version}`);
    console.log(`👨‍💻 By ${info.author} (${info.organization})`);
    console.log('');

    // Create and start HTTP server
    console.log('🚀 Starting HTTP server...');
    const server = handler.createServer({
        autoStart: true // Automatically start the server
    });

    // Server is now running and handling requests
    console.log('✅ Server started successfully!');
    console.log('');
    console.log('🌐 Available endpoints:');
    console.log('   POST /sendNotification - Send notification');
    console.log('   GET  /health         - Health check');
    console.log('');
    console.log('🧪 Test commands:');
    console.log('   curl http://localhost:3000/health');
    console.log('   npm run test-helper');
    console.log('');
    console.log('Press Ctrl+C to stop the server');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        process.exit(0);
    });
}

// Run the example
if (require.main === module) {
    serverExample();
}

module.exports = serverExample;
