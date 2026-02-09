const express = require('express');
const passport = require('passport');
const oauthController = require('../controllers/oauthController');
const auth = require('../middlewares/auth').authenticateToken;
const OAuthService = require('../services/oauthService');

const router = express.Router();

// Initialize OAuth service
const oauthService = new OAuthService();

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
  oauthController.googleCallback
);

// Google OAuth callback for API (returns JSON instead of redirect)
router.get('/google/callback/json',
  passport.authenticate('google', { session: false }),
  oauthController.googleCallbackJson
);

// Initiate Google auth (returns auth URL for frontend)
router.get('/google/init', oauthController.initiateGoogleAuth);

// Get OAuth configuration status (public endpoint)
router.get('/config-status', (req, res) => {
  try {
    const oauthConfigured = oauthService.isConfigured();
    res.json({
      success: true,
      data: {
        oauthConfigured: oauthConfigured,
        provider: 'google',
        clientIdConfigured: !!(process.env.GOOGLE_CLIENT_ID),
        clientSecretConfigured: !!(process.env.GOOGLE_CLIENT_SECRET)
      }
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Google OAuth is not configured',
      data: {
        oauthConfigured: false,
        provider: 'google',
        clientIdConfigured: false,
        clientSecretConfigured: false
      }
    });
  }
});

// Get OAuth status for current user
router.get('/status', auth, oauthController.getOAuthStatus);

// Link Google account to existing account
router.post('/google/link', auth, oauthController.linkGoogleAccount);

// Unlink Google account from existing account
router.delete('/google/unlink', auth, oauthController.unlinkGoogleAccount);

// Handle linking callback
router.get('/google/link/callback',
  passport.authenticate('google', { failureRedirect: '/settings?error=link_failed' }),
  oauthController.handleLinkCallback
);

module.exports = router;