/**
 * Firebase Notification Handler - Main Entry Point
 * 
 * This is the main entry point that delegates to the optimized server structure.
 * The actual server implementation is located in src/server.js
 * 
 * @author Syed Abdul Qadeer (CEO & Founder, AlwariDev)
 * @version 1.0.0
 */

// Load environment variables first
require('dotenv').config();

// Import and start the optimized server
const server = require('./src/server');

// Start the server
server.start();