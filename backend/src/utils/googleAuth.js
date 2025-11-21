import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID token and returns the user information
 * @param {string} idToken - The Google ID token from the client
 * @returns {Promise<{googleId: string, email: string, name: string, picture: string}>}
 */
export async function verifyGoogleToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    return {
      googleId: payload.sub, // Google's unique user ID
      email: payload.email,
      name: payload.name || payload.given_name || payload.email?.split('@')[0] || 'User',
      picture: payload.picture || null,
      emailVerified: payload.email_verified || false,
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    throw new Error('Invalid Google token');
  }
}

