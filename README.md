# Zawaya DAO Contact API

A NestJS backend API that handles Zawaya DAO contact form submissions, stores data in MongoDB, and syncs contacts to Brevo (formerly Sendinblue).

## Features

- ✅ RESTful API for form submissions
- ✅ MongoDB integration for data persistence
- ✅ Brevo API integration for contact management
- ✅ **Admin email notifications for new form submissions**
- ✅ File upload support (attachments)
- ✅ Input validation with class-validator
- ✅ CORS enabled for frontend integration
- ✅ Environment-based configuration
- ✅ Comprehensive error handling and logging

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or cloud instance)
- Brevo account with API key

## Installation

1. **Clone the repository (if applicable)**
   ```bash
   cd form-handler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configurations:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/form-handler
   
   # Brevo Configuration
   BREVO_API_KEY=your-actual-brevo-api-key
   
   # Legacy Brevo List ID (for Blockyfy form)
   BREVO_LIST_ID=your-blockyfy-list-id
   
   # Zawaya/Nextsense Brevo List Configuration
   ZAWAYA_CONTACT_LIST=zawayadao-contacts
   ZAWAYA_CONTACT_ID=6
   
   # Admin Notification Configuration
   ADMIN_EMAIL=admin@yourdomain.com
   
   # Server Configuration
   PORT=3000
   
   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200
   ```

4. **Start MongoDB**
   
   If running MongoDB locally:
   ```bash
   mongod
   ```
   
   Or use MongoDB Atlas for cloud hosting.

## Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

The API will be available at `http://localhost:3000`

## API Endpoints

### POST /form/submit
Submit a contact form with optional file attachments.

**Content-Type:** `multipart/form-data`

**Request Body:**
```javascript
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "interests": ["Website Development", "Blockchain Solutions"],
  "budget": "$10,000 - $25,000",
  "message": "I'm interested in building a web application",
  "newsletterSubscribed": true,
  "privacyPolicyAccepted": true,
  "attachments": [File] // Optional file uploads (max 5 files, 5MB each)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Form submitted successfully",
  "submissionId": "507f1f77bcf86cd799439011"
}
```

### POST /form/submit-json
Submit a contact form without file attachments (JSON only).

**Content-Type:** `application/json`

**Request Body:** Same as above (without attachments field)

## Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firstName | string | Yes | Contact's first name |
| lastName | string | Yes | Contact's last name |
| email | string | Yes | Valid email address |
| interests | string[] | Yes | Array of selected interests |
| budget | string | Yes | Budget range |
| message | string | No | Additional message |
| newsletterSubscribed | boolean | Yes | Newsletter opt-in |
| privacyPolicyAccepted | boolean | Yes | Privacy policy acceptance |
| attachments | File[] | No | File uploads (max 5, 5MB each) |

## Brevo Integration

The application automatically syncs contact information to Brevo:

1. **Contact Creation/Update**: Creates or updates contact with email, name, and custom attributes
2. **Custom Attributes**: Stores interests, budget, and message as contact attributes
3. **List Management**: Adds contacts to specified list if newsletter is subscribed
4. **Admin Notifications**: Automatically sends formatted email to admin with full submission details
5. **Error Handling**: Form submission succeeds even if Brevo sync fails (async operation)

### Brevo Setup

1. Create a Brevo account at [brevo.com](https://www.brevo.com)
2. Generate an API key from Settings → API Keys
3. (Optional) Create a contact list and note the List ID
4. Set your admin email address to receive notifications
5. Update your `.env` file with the API key, List ID, and admin email

### Admin Email Notifications

When a form is successfully submitted and synced to Brevo, the system automatically sends a well-formatted email to the configured admin address containing:
- Contact information (name and email)
- Form submission details (interests, budget, newsletter subscription)
- Any message provided by the user
- List of attached files (if any)
- Submission ID and timestamp for reference

This ensures admins are immediately notified of new form submissions without needing to check the database or Brevo dashboard.

## Project Structure

```
form-handler/
├── src/
│   ├── dto/
│   │   └── create-form-submission.dto.ts    # Validation DTO
│   ├── modules/
│   │   └── form/
│   │       ├── brevo.service.ts             # Brevo API integration
│   │       ├── form.controller.ts           # HTTP endpoints
│   │       ├── form.module.ts               # Module definition
│   │       └── form.service.ts              # Business logic
│   ├── schemas/
│   │   └── form-submission.schema.ts        # MongoDB schema
│   ├── app.module.ts                        # Root module
│   └── main.ts                              # Application entry point
├── uploads/                                 # File upload directory
├── .env                                     # Environment variables
└── package.json
```

## Development

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## Frontend Integration Example

### Using Fetch API
```javascript
const formData = new FormData();
formData.append('firstName', 'John');
formData.append('lastName', 'Doe');
formData.append('email', 'john@example.com');
formData.append('interests', JSON.stringify(['Website Development']));
formData.append('budget', '$10,000 - $25,000');
formData.append('message', 'Hello!');
formData.append('newsletterSubscribed', 'true');
formData.append('privacyPolicyAccepted', 'true');

// Add files if needed
const fileInput = document.querySelector('#attachments');
for (let file of fileInput.files) {
  formData.append('attachments', file);
}

const response = await fetch('http://localhost:3000/form/submit', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result);
```

### Using Axios
```javascript
import axios from 'axios';

const formData = new FormData();
// ... append fields as above

const response = await axios.post('http://localhost:3000/form/submit', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

## Error Handling

The API returns appropriate HTTP status codes:

- `201 Created`: Form submitted successfully
- `400 Bad Request`: Validation error (missing or invalid fields)
- `500 Internal Server Error`: Server error

## Security Considerations

- ✅ Input validation with class-validator
- ✅ CORS configuration for allowed origins
- ✅ File upload size limits (5MB per file, max 5 files)
- ✅ Whitelist validation (strips unknown properties)
- ⚠️ Consider adding rate limiting for production
- ⚠️ Consider adding authentication/authorization if needed
- ⚠️ Configure file type restrictions based on requirements

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| MONGODB_URI | MongoDB connection string | - | Yes |
| BREVO_API_KEY | Brevo API key | - | Yes |
| ADMIN_EMAIL | Email address to receive form submission notifications | - | No |
| PORT | Server port | 3000 | No |
| ALLOWED_ORIGINS | CORS allowed origins (comma-separated) | http://localhost:3000 | No |
| BREVO_LIST_ID | Brevo list ID for Blockyfy newsletter (legacy) | - | No |
| ZAWAYA_CONTACT_LIST | Brevo list name for Nextsense/Zawaya contacts | zawayadao-contacts | No |
| ZAWAYA_CONTACT_ID | Brevo list ID for Nextsense/Zawaya contacts | 6 | No |

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network connectivity

### Brevo Sync Failures
- Verify API key is correct
- Check Brevo account status
- Review logs for specific errors
- Form submission will still succeed even if Brevo sync fails

### File Upload Issues
- Check uploads directory permissions
- Verify file size limits
- Ensure correct Content-Type header

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please refer to the [NestJS documentation](https://docs.nestjs.com) or [Brevo API documentation](https://developers.brevo.com).
