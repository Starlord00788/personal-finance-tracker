const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const UserRepository = require('../repositories/userRepository');
const NotificationController = require('../controllers/notificationController');

class OAuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.initializeGoogleStrategy();
  }

  initializeGoogleStrategy() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.warn('⚠️  Google OAuth credentials not found. OAuth will be disabled.');
      return;
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/auth/google/callback`;
    const absoluteCallback = callbackUrl.startsWith('http') ? callbackUrl : `${baseUrl}${callbackUrl}`;

    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: absoluteCallback
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const result = await this.handleGoogleAuth(profile, accessToken);
        return done(null, result);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }));

    // Serialize user for session
    passport.serializeUser((user, done) => {
      // user may be { user: userObj, isNewUser: boolean } from handleGoogleAuth
      const userId = user.user ? user.user.id : user.id;
      done(null, userId);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
      try {
        const user = await this.userRepository.findById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  async handleGoogleAuth(profile, accessToken) {
    try {
      const email = profile.emails[0].value;
      const firstName = profile.name.givenName;
      const lastName = profile.name.familyName;
      const googleId = profile.id;

      // Check if user already exists by email
      let user = await this.userRepository.findByEmail(email);

      if (user) {
        // User exists - update Google ID if not set
        if (!user.google_id) {
          await this.updateUserGoogleId(user.id, googleId);
          user.google_id = googleId;
        }
        
        console.log('✅ Existing user logged in via Google:', email);
        return {
          user,
          isNewUser: false
        };
      }

      // Create new user with Google OAuth
      user = await this.createGoogleUser({
        email,
        firstName,
        lastName,
        googleId
      });

      console.log('✅ New user created via Google OAuth:', email);
      
      // Send welcome email
      try {
        await NotificationController.triggerWelcomeEmail(user);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      return {
        user,
        isNewUser: true
      };
    } catch (error) {
      console.error('Error in handleGoogleAuth:', error);
      throw error;
    }
  }

  async createGoogleUser({ email, firstName, lastName, googleId }) {
    const userData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      password_hash: null, // No password for OAuth users
      google_id: googleId,
      email_verified: true, // Google emails are pre-verified
      auth_provider: 'google'
    };

    return await this.userRepository.createOAuthUser(userData);
  }

  async updateUserGoogleId(userId, googleId) {
    await this.userRepository.updateById(userId, {
      google_id: googleId,
      auth_provider: 'google'
    });
  }

  async linkGoogleAccount(userId, googleProfile) {
    const googleId = googleProfile.id;
    const email = googleProfile.emails[0].value;

    // Verify the email matches the user's email
    const user = await this.userRepository.findById(userId);
    if (user.email !== email) {
      throw new Error('Google account email does not match your account email');
    }

    await this.updateUserGoogleId(userId, googleId);
    
    return {
      success: true,
      message: 'Google account linked successfully'
    };
  }

  async unlinkGoogleAccount(userId) {
    const user = await this.userRepository.findById(userId);
    
    // Ensure user has a password set before unlinking OAuth
    if (!user.password_hash) {
      throw new Error('You must set a password before unlinking your Google account');
    }

    await this.userRepository.updateById(userId, {
      google_id: null,
      auth_provider: 'local'
    });

    return {
      success: true,
      message: 'Google account unlinked successfully'
    };
  }

  isConfigured() {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }

  generateAuthURL(state = null) {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth not configured');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const callbackPath = process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/auth/google/callback`;
    // Ensure absolute URL — if it's a relative path, prepend base URL
    const redirectUri = callbackPath.startsWith('http') ? callbackPath : `${baseUrl}${callbackPath}`;

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'openid email profile',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    if (state) {
      params.append('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
}

module.exports = OAuthService;