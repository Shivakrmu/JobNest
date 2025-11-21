import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { generateId } from '../utils/generateId.js';
import { verifyGoogleToken } from '../utils/googleAuth.js';
// use global fetch provided by Node 18+

export const login = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    // Check if user exists, if not create one
    let user = await User.findOne({ name, role });
    
    if (!user) {
      user = await User.create({
        name,
        email: email || null,
        role
      });
    }

    const token = generateToken({ 
      id: user._id.toString(), 
      name: user.name, 
      role: user.role, 
      email: user.email 
    });

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
};

export const getSession = async (req, res) => {
  try {
    // Token is verified by middleware, user is in req.user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session', message: error.message });
  }
};

export const logout = (req, res) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  res.json({ message: 'Logged out successfully' });
};

// Google OAuth authentication
export const googleAuth = async (req, res) => {
  try {
    const { idToken, role } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token is required' });
    }

    // Verify the Google ID token
    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser.emailVerified && !googleUser.email) {
      return res.status(400).json({ error: 'Email verification required' });
    }

    // Check if user exists by Google ID or email
    let user = await User.findOne({ 
      $or: [
        { googleId: googleUser.googleId },
        { email: googleUser.email }
      ]
    });

    if (!user) {
      // Create new user with Google authentication
      // Default role to student if not provided
      const userRole = role === 'employer' ? 'employer' : 'student';
      
      user = await User.create({
        googleId: googleUser.googleId,
        name: googleUser.name,
        email: googleUser.email,
        role: userRole,
        // Store profile picture URL if available
        picture: googleUser.picture || null,
      });
    } else {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
      }
      // Update name and email if changed
      if (user.name !== googleUser.name) {
        user.name = googleUser.name;
      }
      if (user.email !== googleUser.email) {
        user.email = googleUser.email;
      }
      if (googleUser.picture && !user.picture) {
        user.picture = googleUser.picture;
      }
      await user.save();
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      role: user.role,
      email: user.email,
    });

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        picture: user.picture || null,
      },
      token,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ 
      error: 'Google authentication failed', 
      message: error.message 
    });
  }
};

// Verify Supabase access token by calling Supabase auth user endpoint
export const supabaseVerify = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Supabase access token required in Authorization header' });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    if (!SUPABASE_URL) return res.status(500).json({ error: 'SUPABASE_URL not configured on server' });

    const resp = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resp.ok) {
      const body = await resp.text();
      return res.status(401).json({ error: 'Invalid Supabase token', detail: body });
    }

    const userInfo = await resp.json();
    // userInfo contains id, email, user_metadata, etc.
    const externalId = userInfo.id;
    const email = userInfo.email || null;
    const meta = userInfo.user_metadata || {};
    const name = meta.full_name || meta.name || email || 'User';

    // Upsert user in our DB
    let user = await User.findOne({ externalId });
    if (!user) {
      // default role to student; map recruiter -> employer if present
      let role = (meta.role || 'student');
      if (role === 'recruiter') role = 'employer';
      user = await User.create({ externalId, name, email, role });
    } else {
      // update basic info if changed
      let changed = false;
      if (user.email !== email) { user.email = email; changed = true; }
      if (user.name !== name) { user.name = name; changed = true; }
      if (changed) await user.save();
    }

    const tokenOut = generateToken({ id: user._id.toString(), name: user.name, role: user.role, email: user.email });

    res.json({ user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role, companyId: user.companyId }, token: tokenOut });
  } catch (error) {
    console.error('Supabase verify error:', error);
    res.status(500).json({ error: 'Failed to verify Supabase token', message: error.message });
  }
};
