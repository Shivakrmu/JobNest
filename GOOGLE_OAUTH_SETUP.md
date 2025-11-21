# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the HireNest application.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to the Google Cloud Console

## Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: HireNest (or your app name)
     - User support email: your email
     - Developer contact information: your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (if in testing mode)
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: HireNest Web Client
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for local development)
     - `http://localhost:3000` (if using different port)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:5173/auth` (for local development)
     - `http://localhost:3000/auth` (if using different port)
     - Your production auth callback URL
7. Click **Create**
8. Copy the **Client ID** (you'll need this for both frontend and backend)

## Step 2: Configure Backend

1. Create a `.env` file in the `backend/` directory (if it doesn't exist)
2. Add the following environment variable:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
JWT_SECRET=your-secure-jwt-secret-key
PORT=5000
MONGODB_URI=mongodb://localhost:27017/student-job-portal
```

**Important:** 
- Replace `your-google-client-id.apps.googleusercontent.com` with your actual Client ID from Step 1
- Use the same Client ID for both frontend and backend
- Set a strong, random JWT_SECRET for production

## Step 3: Configure Frontend

1. Create a `.env` file in the `frontend/` directory (if it doesn't exist)
2. Add the following environment variable:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000
```

**Important:**
- Replace `your-google-client-id.apps.googleusercontent.com` with the same Client ID from Step 1
- The Client ID must match between frontend and backend
- Update `VITE_API_URL` to your backend URL in production

## Step 4: Restart Your Development Servers

After setting up the environment variables:

1. Restart your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Restart your frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

## Step 5: Test Google Authentication

1. Navigate to the login page (`/auth`)
2. Click "Continue with Google"
3. You should see the Google sign-in popup
4. Sign in with a Google account
5. You should be redirected to the appropriate dashboard

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use different Client IDs** for development and production
3. **Keep your JWT_SECRET secure** and use a strong random string
4. **Verify authorized origins** match your actual domains
5. **Enable HTTPS** in production

## Troubleshooting

### "Google OAuth is not configured" error
- Check that `VITE_GOOGLE_CLIENT_ID` is set in your frontend `.env` file
- Restart your frontend development server after adding the variable

### "Invalid Google token" error
- Verify that `GOOGLE_CLIENT_ID` in backend `.env` matches the frontend
- Ensure the Client ID is correct and not expired
- Check that authorized origins include your current domain

### CORS errors
- Make sure your backend CORS configuration allows your frontend origin
- Check that authorized JavaScript origins in Google Console match your frontend URL

### Token verification fails
- Verify the Google Client ID is the same in both frontend and backend
- Check that the token hasn't expired (they expire after 1 hour)
- Ensure your backend has internet access to verify tokens with Google

## Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 for Client-side Web Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Google Cloud Console](https://console.cloud.google.com/)

