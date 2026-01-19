# 🚀 Start Here - Form Handler API

Welcome! This is a complete NestJS backend for handling your contact form.

## What This Does

✅ **Receives form submissions** from your frontend  
✅ **Saves data to MongoDB** for record-keeping  
✅ **Syncs contacts to Brevo** for email marketing  
✅ **Handles file uploads** (attachments)  
✅ **Validates all input** to prevent bad data  

---

## Quick Start (Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` and add:
- Your MongoDB connection string
- Your Brevo API key (get from https://app.brevo.com)

### 3. Start MongoDB
If using local MongoDB:
```bash
mongod
```

Or use MongoDB Atlas (cloud) - see [ENV_SETUP.md](ENV_SETUP.md)

### 4. Run the Application
```bash
npm run start:dev
```

You should see:
```
🚀 Application is running on: http://localhost:3000
📝 Form submission endpoint: http://localhost:3000/form/submit
```

### 5. Test It!

**Option 1: Open the example HTML form**
- Open `example-frontend.html` in your browser
- Fill out and submit!

**Option 2: Use the test file**
- Open `test-api.http` in VS Code (with REST Client extension)
- Click "Send Request"

**Option 3: Use curl**
```bash
curl -X POST http://localhost:3000/form/submit-json \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "interests": ["Website Development"],
    "budget": "$5,000 - $10,000",
    "message": "Test message",
    "newsletterSubscribed": true,
    "privacyPolicyAccepted": true
  }'
```

---

## Project Structure

```
form-handler/
├── src/
│   ├── dto/                           # Data validation rules
│   ├── modules/form/                  # Main form handling logic
│   │   ├── brevo.service.ts          # Brevo integration
│   │   ├── form.controller.ts        # API endpoints
│   │   ├── form.service.ts           # Business logic
│   │   └── form.module.ts
│   ├── schemas/                       # MongoDB models
│   ├── app.module.ts                  # Root module
│   └── main.ts                        # Entry point
├── uploads/                           # File uploads stored here
├── .env                               # Your config (don't commit!)
├── example-frontend.html              # Test form
├── test-api.http                      # API test examples
└── README.md                          # Full documentation
```

---

## API Endpoints

### POST `/form/submit`
Submit form with file attachments (multipart/form-data)

### POST `/form/submit-json`
Submit form without files (application/json)

**Required Fields:**
- `firstName` (string)
- `lastName` (string)
- `email` (valid email)
- `interests` (array of strings, min 1 item)
- `budget` (string)
- `newsletterSubscribed` (boolean)
- `privacyPolicyAccepted` (boolean)

**Optional Fields:**
- `message` (string)
- `attachments` (files, max 5 files, 5MB each)

---

## Frontend Integration

### Example Form Data

```javascript
const formData = new FormData();
formData.append('firstName', 'John');
formData.append('lastName', 'Doe');
formData.append('email', 'john@example.com');
formData.append('interests', JSON.stringify(['Website Development']));
formData.append('budget', '$10,000 - $25,000');
formData.append('message', 'I need a website');
formData.append('newsletterSubscribed', 'true');
formData.append('privacyPolicyAccepted', 'true');

// Add files if any
const fileInput = document.querySelector('#attachments');
for (let file of fileInput.files) {
  formData.append('attachments', file);
}

// Submit to API
const response = await fetch('http://localhost:3000/form/submit', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result);
```

### Response Format

**Success (201)**:
```json
{
  "success": true,
  "message": "Form submitted successfully",
  "submissionId": "507f1f77bcf86cd799439011"
}
```

**Error (400)**:
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "interests must contain at least 1 elements"],
  "error": "Bad Request"
}
```

---

## Documentation

- **[QUICK_START.md](QUICK_START.md)** - Detailed setup guide
- **[ENV_SETUP.md](ENV_SETUP.md)** - MongoDB & Brevo setup
- **[SIMPLE_DEPLOYMENT.md](SIMPLE_DEPLOYMENT.md)** - Deploy to production
- **[README.md](README.md)** - Complete technical documentation
- **[test-api.http](test-api.http)** - API testing examples
- **[postman-collection.json](postman-collection.json)** - Import into Postman

---

## Common Commands

```bash
# Development
npm run start:dev          # Run with hot reload
npm run build             # Build for production
npm run start:prod        # Run production build

# Testing
npm test                  # Run unit tests
npm run test:e2e          # Run e2e tests
npm run test:cov          # Test coverage

# Code Quality
npm run lint              # Check code style
npm run format            # Format code
```

---

## Environment Variables

Create a `.env` file:

```env
# MongoDB (Required)
MONGODB_URI=mongodb://localhost:27017/form-handler

# Brevo (Required)
BREVO_API_KEY=your-api-key-here

# Server (Optional)
PORT=3000
NODE_ENV=development

# CORS (Optional)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200

# Brevo List (Optional)
BREVO_LIST_ID=
```

---

## Troubleshooting

### "Cannot connect to MongoDB"
- Is MongoDB running? Try `mongod`
- Check your MONGODB_URI in `.env`
- If using Atlas, check IP whitelist and credentials

### "Brevo API key not configured"
- Get your API key from https://app.brevo.com → Settings → API Keys
- Update BREVO_API_KEY in `.env`
- Restart the application

### "Port 3000 is already in use"
- Change PORT in `.env` to another port (e.g., 3001)
- Or stop the other process using port 3000

### CORS errors from frontend
- Add your frontend URL to ALLOWED_ORIGINS in `.env`
- Restart the application
- Clear browser cache

---

## Deployment

Ready to deploy? Follow **[SIMPLE_DEPLOYMENT.md](SIMPLE_DEPLOYMENT.md)** for step-by-step instructions to deploy to production using:
- MongoDB Atlas (cloud database)
- PM2 (process manager)
- Nginx (web server)
- Let's Encrypt (free SSL)

Total cost: ~$5-10/month

---

## Features

✨ **Production-Ready**
- Input validation with class-validator
- Error handling and logging
- File upload support with size limits
- CORS configuration
- Environment-based configuration

🔐 **Secure**
- Input sanitization
- File size limits (5MB per file)
- CORS protection
- MongoDB injection protection

📊 **Observable**
- Comprehensive logging
- Tracks Brevo sync status
- Stores file paths and metadata

---

## Tech Stack

- **NestJS** - Enterprise Node.js framework
- **MongoDB** - NoSQL database via Mongoose
- **Brevo** - Email marketing and contact management
- **TypeScript** - Type-safe JavaScript
- **Class Validator** - Input validation
- **Multer** - File upload handling

---

## Need Help?

1. Check the [README.md](README.md) for detailed docs
2. Look at [test-api.http](test-api.http) for API examples
3. Open [example-frontend.html](example-frontend.html) for a working form
4. Review [ENV_SETUP.md](ENV_SETUP.md) for configuration help

---

## License

MIT

---

**Ready to go? Run `npm run start:dev` and start building!** 🎉

