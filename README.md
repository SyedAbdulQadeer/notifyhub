# Firebase Notification Relay Server

A **stateless** Node.js server that receives AES-encrypted Firebase service account credentials and sends push notifications via Firebase Cloud Messaging (FCM).

## 🚀 Features

- ✅ **Stateless Operation** - No credential storage or app reuse
- ✅ **AES-256-CBC Decryption** - Secure credential handling
- ✅ **Built-in HTTP Module** - No Express dependency
- ✅ **CORS Support** - Ready for web clients
- ✅ **Dynamic Firebase Apps** - Creates and destroys apps per request
- ✅ **Error Handling** - Comprehensive error responses

## 📋 Requirements

- Node.js 16+ 
- Firebase Admin SDK
- Environment variable: `SECRET_KEY`

## 🔧 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and set your SECRET_KEY
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## 🌐 API Endpoint

**POST** `/sendNotification`

### Request Body:
```json
{
  "firebaseConfig": "<AES-256-CBC encrypted Base64 string>",
  "token": "user_fcm_token",
  "title": "Notification title", 
  "body": "Notification body"
}
```

### Success Response:
```json
{
  "success": true,
  "response": "<firebase_response>",
  "message": "Notification sent successfully",
  "timestamp": "2025-10-05T10:30:00.000Z"
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🧪 Testing

### Using curl:
```bash
curl -X POST http://localhost:3000/sendNotification \
-H "Content-Type: application/json" \
-d '{
  "firebaseConfig": "<encrypted_config_string>",
  "token": "<user_fcm_token>",
  "title": "Hello",
  "body": "This is from AlwariDev"
}'
```

## 🔐 Encryption Details

- **Algorithm:** AES-256-CBC
- **Key:** Environment variable `SECRET_KEY`
- **IV:** 16 null bytes (`Buffer.alloc(16, 0)`)
- **Format:** Base64 encoded encrypted data

## 📁 Project Structure

```
firebase_notification_handler/
├── server.js           # Main server file
├── package.json        # Dependencies and scripts
├── .env.example        # Environment variables template
└── README.md          # This file
```

## 🔒 Security Notes

1. **SECRET_KEY** must be kept secure and match your Flutter client
2. Firebase credentials are decrypted temporarily and never stored
3. Each Firebase app is automatically cleaned up after use
4. All errors are sanitized before returning to client

## 🚦 Status Codes

- **200** - Success
- **400** - Bad Request (missing/invalid fields)
- **404** - Not Found (wrong endpoint)
- **500** - Internal Server Error

## 👨‍💻 Author

**AlwariDev** - Stateless Firebase notification relay specialist

---

*Ready to relay your Firebase notifications securely! 🔥📱*
