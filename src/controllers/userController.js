const UserService = require('../services/userService');
const { validationResult } = require('express-validator');

const userService = new UserService();

class UserController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userData = req.body;
      const result = await userService.register(userData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      if (error.message === 'Email already exists') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;
      const result = await userService.login({ email, password });
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const user = await userService.getUserProfile(userId);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.userId;
      const userData = req.body;
      const user = await userService.updateProfile(userId, userData);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      if (error.message === 'Email already exists') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;
      
      await userService.changePassword(userId, currentPassword, newPassword);
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      if (error.message === 'Invalid current password') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async deleteAccount(req, res) {
    try {
      const userId = req.user.userId;
      await userService.deleteUserAccount(userId);
      
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new UserController();