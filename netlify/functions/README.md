# Netlify Functions - Email Setup

## Welcome Email Function

The `send-welcome-email.js` function sends a welcome email to new users when they register for the gallery.

### Environment Variables Required

You need to set the following environment variables in your Netlify dashboard:

1. `EMAIL_USER` - Gmail address for sending emails
2. `EMAIL_PASS` - Gmail app password (not regular password)

### Gmail Setup Instructions

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use this app password as `EMAIL_PASS`

### Installation

```bash
cd netlify/functions
npm install
```

### Testing

The function can be tested locally using Netlify CLI:

```bash
netlify dev
```

Then send a POST request to `/.netlify/functions/send-welcome-email` with:

```json
{
  "email": "user@example.com",
  "displayName": "ユーザー名"
}
```

### Notes

- The function is called automatically when a new user registers
- If email sending fails, the registration still succeeds (user is not notified of email failure)
- The email includes a beautiful HTML template with MC Square branding
- CORS is properly configured for cross-origin requests 