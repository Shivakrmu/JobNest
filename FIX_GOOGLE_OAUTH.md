# Fix: Google OAuth "Origin Not Allowed" Error

## The Problem
Google is rejecting `http://localhost:5173` because it's not properly registered in Google Cloud Console.

## Step-by-Step Fix (DO THIS NOW):

### 1. Go to Google Cloud Console
- Open: https://console.cloud.google.com/apis/credentials?project=jobnest-478905
- Make sure "JobNest" project is selected

### 2. Find Your OAuth Client
- Look for the OAuth 2.0 Client ID: `938959008444-3i0r4ju1d5715f7poarrcqas5fk3e572.apps.googleusercontent.com`
- Click on the **pencil/edit icon** (or click the name)

### 3. Check Authorised JavaScript origins
- Scroll to "Authorised JavaScript origins"
- You MUST see exactly: `http://localhost:5173` (no trailing slash, no spaces)
- If it's NOT there:
  - Click "+ ADD URI"
  - Type exactly: `http://localhost:5173`
  - Press Enter

### 4. Check Authorised redirect URIs
- Scroll to "Authorised redirect URIs"
- You MUST see exactly: `http://localhost:5173/auth`
- If it's NOT there:
  - Click "+ ADD URI"
  - Type exactly: `http://localhost:5173/auth`
  - Press Enter

### 5. SAVE (CRITICAL!)
- Scroll to the bottom
- Click the blue **"SAVE"** button
- Wait for the success message

### 6. Wait 1-2 Minutes
- Google's changes can take 1-2 minutes to propagate

### 7. Clear Browser Cache
- Press `Ctrl+Shift+Delete`
- Select "Cached images and files"
- Click "Clear data"

### 8. Hard Refresh
- Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- Try Google Sign-In again

## If Still Not Working:

### Option A: Verify the Client ID
Make sure you're using the correct Client ID in your `.env` file:
- Frontend: `VITE_GOOGLE_CLIENT_ID=938959008444-3i0r4ju1d5715f7poarrcqas5fk3e572.apps.googleusercontent.com`
- Backend: `GOOGLE_CLIENT_ID=938959008444-3i0r4ju1d5715f7poarrcqas5fk3e572.apps.googleusercontent.com`

### Option B: Create a New OAuth Client
If the above doesn't work, create a fresh OAuth client:
1. Delete the current one
2. Create a new one with the same settings
3. Update your `.env` files with the new Client ID

