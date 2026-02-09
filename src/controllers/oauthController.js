const OAuthService = require('../services/oauthService');
const AuthUtils = require('../utils/auth');
const UserRepository = require('../repositories/userRepository');

const oauthService = new OAuthService();
const userRepository = new UserRepository();

class OAuthController {
  async googleAuth(req, res, next) {
    // This will be handled by passport middleware
    // Just a placeholder for route definition
  }

  async googleCallback(req, res) {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
      }

      const { user, isNewUser } = req.user;
      
      // Generate JWT token
      const token = AuthUtils.generateToken({
        userId: user.id,
        email: user.email
      });

      // Set secure cookie with token
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
      });

      const redirectUrl = isNewUser 
        ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?welcome=true`
        : `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

      console.log(`✅ Google OAuth success - redirecting to: ${redirectUrl}`);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_error`);
    }
  }

  async linkGoogleAccount(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user.id;

      // Store user ID in session for linking
      req.session.linkUserId = userId;
      req.session.linkAction = 'google';

      const authUrl = oauthService.generateAuthURL(`link_${userId}`);
      
      res.json({
        success: true,
        authUrl: authUrl,
        message: 'Redirect to Google for account linking'
      });
    } catch (error) {
      console.error('Error initiating Google account linking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate Google account linking'
      });
    }
  }

  async unlinkGoogleAccount(req, res) {
    try {
      const userId = req.user.id;
      const result = await oauthService.unlinkGoogleAccount(userId);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error unlinking Google account:', error);
      
      if (error.message.includes('password')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to unlink Google account'
      });
    }
  }

  async getOAuthStatus(req, res) {
    try {
      const userId = req.user.id;
      const user = await userRepository.findById(userId);

      const hasGoogleLinked = !!user.google_id;
      const hasPassword = !!user.password_hash;
      const authProvider = user.auth_provider || 'local';

      res.json({
        success: true,
        data: {
          googleLinked: hasGoogleLinked,
          hasPassword: hasPassword,
          authProvider: authProvider,
          canUnlinkGoogle: hasGoogleLinked && hasPassword,
          oauthConfigured: oauthService.isConfigured()
        }
      });
    } catch (error) {
      console.error('Error getting OAuth status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get OAuth status'
      });
    }
  }

  async initiateGoogleAuth(req, res) {
    try {
      if (!oauthService.isConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Google OAuth is not configured'
        });
      }

      const authUrl = oauthService.generateAuthURL();
      
      res.json({
        success: true,
        authUrl: authUrl,
        message: 'Redirect to Google for authentication'
      });
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate Google authentication'
      });
    }
  }

  // For API testing - returns user info after OAuth
  async googleCallbackJson(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'OAuth authentication failed'
        });
      }

      const { user, isNewUser } = req.user;
      
      // Generate JWT token
      const token = AuthUtils.generateToken({
        userId: user.id,
        email: user.email
      });

      res.json({
        success: true,
        message: isNewUser ? 'Account created successfully' : 'Login successful',
        data: {
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            auth_provider: user.auth_provider || 'google'
          },
          accessToken: token,
          isNewUser: isNewUser
        }
      });
    } catch (error) {
      console.error('OAuth callback JSON error:', error);
      res.status(500).json({
        success: false,
        message: 'OAuth callback processing failed'
      });
    }
  }

  async handleLinkCallback(req, res) {
    try {
      if (!req.user || !req.session.linkUserId) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?error=link_failed`);
      }

      // req.user from passport is { user: dbUser, isNewUser: bool }
      const googleUser = req.user.user || req.user;
      const linkUserId = req.session.linkUserId;

      // Link using the Google ID and email directly
      await userRepository.updateById(linkUserId, {
        google_id: googleUser.google_id || googleUser.id,
        auth_provider: 'google'
      });

      // Clear session data
      delete req.session.linkUserId;
      delete req.session.linkAction;

      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?success=google_linked`);
    } catch (error) {
      console.error('Error in link callback:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?error=link_error`);
    }
  }
}

module.exports = new OAuthController();