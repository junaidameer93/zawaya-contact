# Zawaya Contact Form API - Frontend Integration

## 🔗 Endpoints

### Base URL
```
http://localhost:3005
```
**Production:** Replace with your production domain

---

## 📡 API Endpoints

### 1. Submit Form (JSON only)
```
POST /zawaya-contact/submit-json
Content-Type: application/json
```

**Use when:** No file uploads needed

### 2. Submit Form (With files)
```
POST /zawaya-contact/submit
Content-Type: multipart/form-data
```

**Use when:** User uploads attachments (max 5 files, 5MB each)

---

## 📋 Request Payload

### Required Fields (with *)
```json
{
  "firstName": "string",          // First Name*
  "lastName": "string",           // Last Name*
  "businessEmail": "string"       // Business Email*
}
```

### Optional Fields
```json
{
  "companyProfile": "string",     // Company Profile
  "companyWebsite": "string",     // Company Website
  "attachments": "files"          // Only for /submit endpoint
}
```

---

## ✅ Success Response (201 Created)

```json
{
  "success": true,
  "message": "Form submitted successfully",
  "submissionId": "507f1f77bcf86cd799439011"
}
```

## ❌ Error Response (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": [
    "businessEmail must be an email",
    "firstName must be longer than or equal to 1 characters"
  ],
  "error": "Bad Request"
}
```

---

## 💻 Code Examples

### Example 1: JSON Submission (No files)

```javascript
const submitForm = async (formData) => {
  const response = await fetch('http://localhost:3005/zawaya-contact/submit-json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firstName: formData.firstName,
      lastName: formData.lastName,
      businessEmail: formData.businessEmail,
      companyProfile: formData.companyProfile || '',      // Optional
      companyWebsite: formData.companyWebsite || '',      // Optional
    }),
  });

  return await response.json();
};
```

### Example 2: With File Uploads

```javascript
const submitFormWithFiles = async (formData, files) => {
  const data = new FormData();
  
  data.append('firstName', formData.firstName);
  data.append('lastName', formData.lastName);
  data.append('businessEmail', formData.businessEmail);
  data.append('companyProfile', formData.companyProfile || '');
  data.append('companyWebsite', formData.companyWebsite || '');
  
  files.forEach(file => data.append('attachments', file));
  
  const response = await fetch('http://localhost:3005/zawaya-contact/submit', {
    method: 'POST',
    body: data,
  });

  return await response.json();
};
```

---

## 🧪 Test Request

```bash
curl -X POST http://localhost:3005/zawaya-contact/submit-json \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Noah",
    "lastName": "James",
    "businessEmail": "noah.james@company.com",
    "companyProfile": "Leading tech company specializing in AI solutions",
    "companyWebsite": "https://www.company.com"
  }'
```

---

## ✨ Validation Rules

| Field | Required | Type | Validation |
|-------|----------|------|------------|
| `firstName` | ✅ Yes | string | Min 1 character |
| `lastName` | ✅ Yes | string | Min 1 character |
| `businessEmail` | ✅ Yes | string | Valid email format |
| `companyProfile` | ⚪ No | string | Any text |
| `companyWebsite` | ⚪ No | string | Any URL |
| `attachments` | ⚪ No | files | Max 5 files, 5MB each |

---

## 📝 Field Mapping

Form labels match exactly with API field names:

| Form Label | API Field Name | Required |
|------------|----------------|----------|
| First Name* | `firstName` | ✅ |
| Last Name* | `lastName` | ✅ |
| Business Email* | `businessEmail` | ✅ |
| Company Profile | `companyProfile` | ⚪ |
| Company Website | `companyWebsite` | ⚪ |

---

**Questions?** Check Swagger docs at: `http://localhost:3005/api`
