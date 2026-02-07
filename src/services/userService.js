const UserRepository = require('../repositories/userRepository');
const AuthUtils = require('../utils/auth');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(userData) {
    const { first_name, last_name, email, password } = userData;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordValidation = AuthUtils.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    const password_hash = await AuthUtils.hashPassword(password);

    const user = await this.userRepository.create({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.toLowerCase().trim(),
      password_hash
    });

    const sessionData = AuthUtils.createUserSession(user);
    const accessToken = AuthUtils.generateToken(sessionData);

    return {
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      },
      accessToken
    };
  }

  async login(credentials) {
    const { email, password } = credentials;

    const user = await this.userRepository.findByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await AuthUtils.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const sessionData = AuthUtils.createUserSession(user);
    const accessToken = AuthUtils.generateToken(sessionData);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferredCurrency: user.preferred_currency
      },
      accessToken
    };
  }

  async getUserProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      preferredCurrency: user.preferred_currency,
      createdAt: user.created_at
    };
  }

  async updateUserProfile(userId, updateData) {
    const { name, email, preferredCurrency } = updateData;

    if (email) {
      const emailExists = await this.userRepository.emailExists(email, userId);
      if (emailExists) {
        throw new Error('Email is already in use');
      }
    }

    return await this.userRepository.updateById(userId, {
      name,
      email,
      preferred_currency: preferredCurrency
    });
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentPasswordValid = await AuthUtils.comparePassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const passwordValidation = AuthUtils.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`New password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    const newPasswordHash = await AuthUtils.hashPassword(newPassword);
    
    const updated = await this.userRepository.updateById(userId, {
      password_hash: newPasswordHash
    });

    return !!updated;
  }

  async deleteUserAccount(userId) {
    return await this.userRepository.deleteById(userId);
  }
}

module.exports = UserService;