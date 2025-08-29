const User = require("../../../models/register/registerModel");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user._id, 
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Shorter expiry for access token
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '-refresh',
    { expiresIn: '7d' } // Longer expiry for refresh token
  );

  return { accessToken, refreshToken };
};

class AuthGoogleController {
  // Public endpoint to expose Google Client ID from server .env
  static getGoogleClientId = async (req, res) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        return res.status(404).json({ success: false, message: 'GOOGLE_CLIENT_ID not configured' });
      }
      return res.status(200).json({
        success: true,
        clientId,
        frontendOrigin: process.env.FRONTEND_URL,
        env: process.env.NODE_ENV
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  // Health endpoint: do not expose full secrets; only non-sensitive hints
  static googleHealth = async (req, res) => {
    try {
      const cid = process.env.GOOGLE_CLIENT_ID || '';
      const suffix = cid ? cid.slice(-16) : null; // last chars only
      const requestOrigin = req.headers.origin || null;
      return res.status(200).json({
        success: true,
        nodeEnv: process.env.NODE_ENV || 'development',
        clientIdSet: Boolean(cid),
        clientIdSuffix: suffix, // just for matching visually
        frontendUrl: process.env.FRONTEND_URL || null,
        requestOrigin
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  // Compare a provided clientId with server env (for debugging)
  static verifyClientId = async (req, res) => {
    try {
      const provided = (req.body?.clientId || '').trim();
      const actual = (process.env.GOOGLE_CLIENT_ID || '').trim();
      if (!actual) {
        return res.status(404).json({ success: false, message: 'GOOGLE_CLIENT_ID not configured' });
      }
      const match = provided && actual && provided === actual;
      return res.status(200).json({
        success: true,
        match,
        providedSuffix: provided ? provided.slice(-16) : null,
        actualSuffix: actual ? actual.slice(-16) : null
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  // Handle Google OAuth callback from frontend
  static googleAuth = async (req, res) => {
    try {
      const { credential } = req.body;
      
      if (!credential) {
        return res.status(400).json({ 
          success: false, 
          message: 'No credential provided' 
        });
      }

      // Verify the Google ID token
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { email, name, sub: googleId, picture } = payload;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Could not get email from Google account'
        });
      }

      // Find or create user
      let user = await User.findOne({ 
        $or: [{ email }, { googleId }]
      });
      
      if (!user) {
        // Do NOT auto-create; require prior registration
        return res.status(403).json({
          success: false,
          error: 'ACCOUNT_REQUIRED',
          message: 'No account found for this Google email. Please register first and then use Google Sign-In.'
        });
      } else {
        // Update existing user with Google ID if not present
        if (!user.googleId) {
          user.googleId = googleId;
        }
        // Ensure email remains the canonical one from Google
        if (email && user.email !== email) {
          user.email = email;
        }
        if (!user.profileImage && picture) {
          user.profileImage = picture;
        }
        if (!user.isVerified) {
          user.isVerified = true;
        }
        await user.save();
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth/refresh-token'
      });

      // Return access token and user data
      res.json({
        success: true,
        token: accessToken,
        refreshToken: process.env.NODE_ENV === 'development' ? refreshToken : undefined,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Authentication failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Refresh access token
  static refreshToken = async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'No refresh token provided'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '-refresh'
      );

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

      // Set new refresh token in HTTP-only cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth/refresh-token'
      });

      res.json({
        success: true,
        token: accessToken,
        refreshToken: process.env.NODE_ENV === 'development' ? newRefreshToken : undefined
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Clear invalid refresh token
      res.clearCookie('refreshToken', {
        path: '/api/auth/refresh-token'
      });
      
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        requiresLogin: true
      });
    }
  };

  // Get current user
  static getCurrentUser = async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authenticated',
          requiresLogin: true
        });
      }
      
      const user = await User.findById(req.user.userId || req.user._id)
        .select('-password -googleId -__v');
        
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found',
          requiresLogin: true
        });
      }
      
      res.status(200).json({ 
        success: true, 
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Logout
  static logout = (req, res) => {
    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      path: '/api/auth/refresh-token'
    });
    
    res.json({
      success: true,
      message: 'Successfully logged out'
    });
  };
  
  // Handle server-side Google OAuth callback
  static googleCallback = async (req, res, next) => {
    try {
      // This is a pass-through since we're using the client-side flow
      // The actual authentication is handled by the googleAuth method
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'No token provided'
        });
      }
      
      // Verify the token and get user info
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      const { email, name, sub: googleId, picture } = payload;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Could not get email from Google account'
        });
      }
      
      // Find or create user (same logic as googleAuth)
      let user = await User.findOne({ 
        $or: [{ email }, { googleId }]
      });
      
      if (!user) {
        user = new User({
          name,
          email,
          googleId,
          profileImage: picture,
          isVerified: true,
          role: 'user'
        });
        await user.save();
      }
      
      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);
      
      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth/refresh-token'
      });
      
      // Return tokens and user data
      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: process.env.NODE_ENV === 'development' ? refreshToken : undefined,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            isVerified: user.isVerified
          }
        }
      });
      
    } catch (error) {
      console.error('Google callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

module.exports = AuthGoogleController;
