const express = require('express');
const currencyController = require('../controllers/currencyController');
const auth = require('../middlewares/auth').authenticateToken;

const router = express.Router();

// Get supported currencies (public endpoint)
router.get('/supported', currencyController.getSupportedCurrencies);

// Get current exchange rates
router.get('/rates', auth, currencyController.getExchangeRates);

// Convert amount between currencies
router.post('/convert', auth, currencyController.convertAmount);

// Get user's portfolio in a specific base currency
router.get('/portfolio', auth, currencyController.getPortfolioInBaseCurrency);

// Update user's default currency
router.put('/default', auth, currencyController.updateUserDefaultCurrency);

module.exports = router;