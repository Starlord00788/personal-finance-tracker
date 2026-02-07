const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
} = require('../validations/userValidation');

// Public routes
router.post('/register', registerValidation, userController.register);
router.post('/login', loginValidation, userController.login);

// Protected routes
router.use(authMiddleware.authenticateToken); // Apply authentication middleware to all routes below

router.get('/profile', userController.getProfile);
router.put('/profile', updateProfileValidation, userController.updateProfile);
router.put('/change-password', changePasswordValidation, userController.changePassword);
router.delete('/account', userController.deleteAccount);

module.exports = router;