const CurrencyService = require('../services/currencyService');
const TransactionService = require('../services/transactionService');
const UserRepository = require('../repositories/userRepository');

const currencyService = new CurrencyService();
const transactionService = new TransactionService();
const userRepository = new UserRepository();

class CurrencyController {
  async getSupportedCurrencies(req, res) {
    try {
      const currencies = currencyService.getSupportedCurrencies();
      res.json({
        success: true,
        data: currencies
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get supported currencies'
      });
    }
  }

  async getExchangeRates(req, res) {
    try {
      const { baseCurrency = 'USD' } = req.query;
      
      if (!currencyService.isValidCurrency(baseCurrency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid base currency'
        });
      }

      const rates = await currencyService.getExchangeRates(baseCurrency);
      res.json({
        success: true,
        data: {
          baseCurrency,
          rates,
          lastUpdate: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get exchange rates'
      });
    }
  }

  async convertAmount(req, res) {
    try {
      const { amount, fromCurrency, toCurrency } = req.body;

      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({
          success: false,
          message: 'Amount, fromCurrency, and toCurrency are required'
        });
      }

      if (!currencyService.isValidCurrency(fromCurrency) || 
          !currencyService.isValidCurrency(toCurrency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid currency code'
        });
      }

      const convertedAmount = await currencyService.convertAmount(
        amount, 
        fromCurrency, 
        toCurrency
      );

      res.json({
        success: true,
        data: {
          originalAmount: amount,
          fromCurrency,
          toCurrency,
          convertedAmount,
          exchangeRate: convertedAmount / amount
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to convert amount'
      });
    }
  }

  async getPortfolioInBaseCurrency(req, res) {
    try {
      const userId = req.user.id;
      const { baseCurrency = 'USD' } = req.query;

      if (!currencyService.isValidCurrency(baseCurrency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid base currency'
        });
      }

      const transactions = await transactionService.getUserTransactions(userId);
      const portfolio = await currencyService.getPortfolioInBaseCurrency(
        transactions, 
        baseCurrency
      );

      let totalInBaseCurrency = 0;
      for (const currency in portfolio) {
        totalInBaseCurrency += portfolio[currency].converted;
      }

      res.json({
        success: true,
        data: {
          baseCurrency,
          portfolio,
          totalInBaseCurrency,
          formattedTotal: currencyService.formatAmount(totalInBaseCurrency, baseCurrency)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get portfolio in base currency'
      });
    }
  }

  async updateUserDefaultCurrency(req, res) {
    try {
      const userId = req.user.id;
      const { currency } = req.body;

      if (!currency) {
        return res.status(400).json({
          success: false,
          message: 'Currency is required'
        });
      }

      if (!currencyService.isValidCurrency(currency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid currency code'
        });
      }

      // Update user's default currency
      await userRepository.updateUserDefaultCurrency(userId, currency);

      res.json({
        success: true,
        message: 'Default currency updated successfully',
        data: { defaultCurrency: currency }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update default currency'
      });
    }
  }
}

module.exports = new CurrencyController();