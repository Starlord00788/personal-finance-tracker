# Email Configuration Guide

Your Personal Finance Tracker now supports real email sending! Here's how to set it up:

## Option 1: Gmail SMTP (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and your device, then generate password

3. **Create `.env` file** in your project root:
```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Personal Finance Tracker
```

## Option 2: SendGrid (Production)

1. **Sign up** at https://sendgrid.com (free tier available)
2. **Get API Key:**
   - Settings → API Keys → Create API Key
   - Choose "Full Access" or "Restricted Access" with Mail Send permissions

3. **Add to `.env` file:**
```env
# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Personal Finance Tracker
```

## Google OAuth Configuration (Optional)

To enable Google OAuth login:

1. **Create Google OAuth App:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials

2. **Add to `.env` file:**
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

3. **Configure redirect URLs:**
   - Add `http://localhost:3000/api/auth/google/callback` for development
   - Add your production domain callback for production

## Testing Email Service

1. **Start your server:** `npm start`
2. **Go to** http://localhost:3000
3. **Navigate to** Email Notifications card
4. **Enter your email** and click "Send Welcome Email"

## Current Email Features

✅ **Welcome Emails** - Sent when users register
✅ **Budget Alerts** - Warn when budgets are exceeded  
✅ **Monthly Reports** - Financial summaries
✅ **Transaction Alerts** - Real-time spending notifications

## Troubleshooting

- **"Email simulated"**: No email service configured
- **"Authentication failed"**: Check your Gmail app password
- **"SMTP connection error"**: Verify host/port settings
- **SendGrid errors**: Check API key permissions

## Security Notes

- Never commit `.env` file to git
- Use app-specific passwords, not your main password
- Consider using environment-specific email addresses