const AuthUtils = require('../utils/auth');
const UserRepository = require('../repositories/userRepository');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is missing'
      });
    }

    const decoded = AuthUtils.verifyToken(token);
    const userRepository = new UserRepository();
    const user = await userRepository.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
      preferredCurrency: user.preferred_currency,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

module.exports = {
  authenticateToken
};