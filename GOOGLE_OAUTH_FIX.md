# Fix: Add Port 8080 to Google OAuth Configuration

## Quick Fix Steps:

1. **Go to Google Cloud Console:**
   - Navigate to: https://console.cloud.google.com/apis/credentials
   - Make sure "JobNest" project is selected

2. **Edit Your OAuth Client:**
   - Find your OAuth 2.0 Client ID (the one you just created)
   - Click on the **pencil/edit icon** (or click the name)

3. **Add Port 8080:**
   - In **Authorised JavaScript origins**, click "+ ADD URI"
   - Add: `http://localhost:8080`
   - In **Authorised redirect URIs**, click "+ ADD URI"  
   - Add: `http://localhost:8080/auth`
   - Click **SAVE**

4. **Restart Your Frontend Server:**
   - Stop your frontend server (Ctrl+C)
   - Start it again: `npm run dev`
   - Refresh your browser

The Google Sign-In should now work!

## Alternative: Change Frontend Port to 5173

If you prefer to use the default Vite port instead:

1. Edit `frontend/vite.config.ts`
2. Change `port: 8080` to `port: 5173`
3. Restart your frontend server
4. Access your app at `http://localhost:5173`

