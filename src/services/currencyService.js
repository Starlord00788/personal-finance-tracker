const axios = require('axios');

class CurrencyService {
  constructor() {
    this.supportedCurrencies = {
      'USD': { name: 'US Dollar', symbol: '$', code: 'USD' },
      'EUR': { name: 'Euro', symbol: '€', code: 'EUR' },
      'GBP': { name: 'British Pound', symbol: '£', code: 'GBP' },
      'JPY': { name: 'Japanese Yen', symbol: '¥', code: 'JPY' },
      'CAD': { name: 'Canadian Dollar', symbol: 'C$', code: 'CAD' },
      'AUD': { name: 'Australian Dollar', symbol: 'A$', code: 'AUD' },
      'CHF': { name: 'Swiss Franc', symbol: 'Fr', code: 'CHF' },
      'CNY': { name: 'Chinese Yuan', symbol: '¥', code: 'CNY' },
      'INR': { name: 'Indian Rupee', symbol: '₹', code: 'INR' },
      'KRW': { name: 'South Korean Won', symbol: '₩', code: 'KRW' }
    };
    this.exchangeRates = {};
    this.lastUpdate = {};
  }

  getSupportedCurrencies() {
    return this.supportedCurrencies;
  }

  async fetchExchangeRates(baseCurrency = 'USD') {
    try {
      // Using free exchange rate API
      const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
      this.exchangeRates[baseCurrency] = response.data.rates;
      this.lastUpdate[baseCurrency] = new Date();
      return this.exchangeRates[baseCurrency];
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error.message);
      // Fallback to cached rates or default rates
      return this.getDefaultRates(baseCurrency);
    }
  }

  getDefaultRates(baseCurrency = 'USD') {
    // Fallback exchange rates (approximate)
    const defaultRates = {
      'USD': {
        'EUR': 0.85,
        'GBP': 0.73,
        'JPY': 110.0,
        'CAD': 1.25,
        'AUD': 1.35,
        'CHF': 0.92,
        'CNY': 6.45,
        'INR': 74.5,
        'KRW': 1180.0,
        'USD': 1.0
      }
    };
    return defaultRates[baseCurrency] || defaultRates['USD'];
  }

  async convertAmount(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;

    const rates = await this.getExchangeRates(fromCurrency);
    const rate = rates[toCurrency];
    
    if (!rate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }

    return amount * rate;
  }

  async getExchangeRates(baseCurrency = 'USD') {
    // Check if rates are cached and recent (less than 1 hour old)
    if (this.exchangeRates[baseCurrency] && this.lastUpdate && this.lastUpdate[baseCurrency]) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (this.lastUpdate[baseCurrency] > hourAgo) {
        return this.exchangeRates[baseCurrency];
      }
    }

    return await this.fetchExchangeRates(baseCurrency);
  }

  formatAmount(amount, currency) {
    const currencyInfo = this.supportedCurrencies[currency];
    if (!currencyInfo) return `${amount} ${currency}`;

    return `${currencyInfo.symbol}${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  isValidCurrency(currencyCode) {
    return !!this.supportedCurrencies[currencyCode];
  }

  async getPortfolioInBaseCurrency(transactions, baseCurrency = 'USD') {
    const portfolio = {};
    
    for (const transaction of transactions) {
      const convertedAmount = await this.convertAmount(
        transaction.amount,
        transaction.currency,
        baseCurrency
      );
      
      if (!portfolio[transaction.currency]) {
        portfolio[transaction.currency] = {
          original: 0,
          converted: 0
        };
      }
      
      portfolio[transaction.currency].original += parseFloat(transaction.amount);
      portfolio[transaction.currency].converted += convertedAmount;
    }
    
    return portfolio;
  }
}

module.exports = CurrencyService;