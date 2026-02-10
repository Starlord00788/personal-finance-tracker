const { v4: uuidv4 } = require('uuid');
const TransactionRepository = require('../repositories/transactionRepository');
const CategoryRepository = require('../repositories/categoryRepository');

class StatementService {
  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.categoryRepository = new CategoryRepository();

    // Keywords for auto-categorization
    this.categoryKeywords = {
      'Groceries': ['grocery', 'supermarket', 'walmart', 'costco', 'kroger', 'aldi', 'trader joe', 'whole foods', 'food', 'market'],
      'Transportation': ['uber', 'lyft', 'gas', 'fuel', 'parking', 'transit', 'metro', 'bus', 'taxi', 'car wash', 'toll'],
      'Utilities': ['electric', 'water', 'gas bill', 'internet', 'phone', 'utility', 'power', 'cable', 'telecom'],
      'Entertainment': ['netflix', 'spotify', 'hulu', 'movie', 'cinema', 'game', 'concert', 'theater', 'disney', 'hbo'],
      'Dining': ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'pizza', 'doordash', 'grubhub', 'ubereats', 'dining'],
      'Shopping': ['amazon', 'target', 'best buy', 'clothing', 'apparel', 'shoe', 'mall', 'store', 'shop', 'ebay'],
      'Healthcare': ['pharmacy', 'doctor', 'hospital', 'medical', 'dental', 'clinic', 'health', 'prescription', 'insurance'],
      'Housing': ['rent', 'mortgage', 'property', 'maintenance', 'repair', 'hoa', 'real estate'],
      'Salary': ['salary', 'payroll', 'wage', 'direct deposit', 'employer', 'paycheck'],
      'Investment': ['dividend', 'interest', 'investment', 'stock', 'bond', 'mutual fund', 'return']
    };
  }

  /**
   * Parse CSV content and extract transactions
   */
  parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const transactions = [];

    // Detect column mapping
    const dateCol = headers.findIndex(h => /date|trans.*date|posted/i.test(h));
    const descCol = headers.findIndex(h => /desc|description|memo|narration|particular/i.test(h));
    const amountCol = headers.findIndex(h => /^amount$|^value$/i.test(h));
    const debitCol = headers.findIndex(h => /debit|withdrawal|expense/i.test(h));
    const creditCol = headers.findIndex(h => /credit|deposit|income/i.test(h));

    if (dateCol === -1) {
      throw new Error('CSV must contain a date column (Date, Transaction Date, Posted)');
    }
    if (descCol === -1 && amountCol === -1 && debitCol === -1) {
      throw new Error('CSV must contain description and amount columns');
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted CSV fields
      const values = this._parseCSVLine(line);

      try {
        let amount, type;
        const description = values[descCol !== -1 ? descCol : 1]?.replace(/"/g, '').trim() || '';
        const dateStr = values[dateCol]?.replace(/"/g, '').trim() || '';

        if (amountCol !== -1) {
          // Single amount column (negative = expense, positive = income)
          const rawAmount = parseFloat(values[amountCol]?.replace(/[",$ ]/g, '') || '0');
          amount = Math.abs(rawAmount);
          type = rawAmount < 0 ? 'expense' : 'income';
        } else if (debitCol !== -1 && creditCol !== -1) {
          // Separate debit/credit columns
          const debit = parseFloat(values[debitCol]?.replace(/[",$ ]/g, '') || '0');
          const credit = parseFloat(values[creditCol]?.replace(/[",$ ]/g, '') || '0');
          if (debit > 0) {
            amount = debit;
            type = 'expense';
          } else {
            amount = credit;
            type = 'income';
          }
        } else {
          continue; // Skip rows we can't parse
        }

        if (amount <= 0 || isNaN(amount)) continue;

        // Parse date
        const parsedDate = this._parseDate(dateStr);
        if (!parsedDate) continue;

        transactions.push({
          date: parsedDate,
          description,
          amount: parseFloat(amount.toFixed(2)),
          type,
          rawLine: line
        });
      } catch (e) {
        // Skip unparseable rows
        continue;
      }
    }

    return transactions;
  }

  /**
   * Parse a single CSV line handling quoted fields
   */
  _parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Parse various date formats
   */
  _parseDate(dateStr) {
    if (!dateStr) return null;

    // Try ISO format first (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    }

    // MM/DD/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
      const parts = dateStr.split('/');
      const d = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    }

    // DD/MM/YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}/.test(dateStr)) {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    }

    // Try native Date parsing as fallback
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }

  /**
   * Auto-categorize a transaction description
   */
  autoCategorize(description) {
    const desc = description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      for (const keyword of keywords) {
        if (desc.includes(keyword)) {
          return category;
        }
      }
    }

    return null; // No match found
  }

  /**
   * Detect duplicates against existing transactions
   */
  async detectDuplicates(userId, parsedTransactions) {
    const existingTransactions = await this.transactionRepository.findByUser(userId, {});

    return parsedTransactions.map(parsed => {
      const isDuplicate = existingTransactions.some(existing => {
        const sameAmount = Math.abs(parseFloat(existing.amount) - parsed.amount) < 0.01;
        const existingDate = existing.transaction_date instanceof Date
          ? existing.transaction_date.toISOString().split('T')[0]
          : (typeof existing.transaction_date === 'string' ? existing.transaction_date.split('T')[0] : null);
        const sameDate = existingDate === parsed.date;
        const sameDesc = existing.description && parsed.description &&
          existing.description.toLowerCase().includes(parsed.description.toLowerCase().substring(0, 20));
        
        return sameAmount && sameDate && (sameDesc || (!existing.description && !parsed.description));
      });

      return { ...parsed, isDuplicate };
    });
  }

  /**
   * Import parsed transactions into the database
   */
  async importTransactions(userId, parsedTransactions, options = {}) {
    const { skipDuplicates = true, defaultCurrency = 'USD' } = options;

    // Get or create categories for auto-categorized transactions
    const userCategories = await this.categoryRepository.findByUser(userId);
    const categoryMap = {};
    userCategories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    const imported = [];
    const skipped = [];
    const errors = [];

    for (const txn of parsedTransactions) {
      // Skip duplicates if option enabled
      if (skipDuplicates && txn.isDuplicate) {
        skipped.push({ ...txn, reason: 'Duplicate detected' });
        continue;
      }

      try {
        // Auto-categorize
        const suggestedCategory = this.autoCategorize(txn.description);
        let categoryId = null;

        if (suggestedCategory && categoryMap[suggestedCategory]) {
          categoryId = categoryMap[suggestedCategory];
        } else if (suggestedCategory) {
          // Create the category
          const type = txn.type;
          const newCat = await this.categoryRepository.create({
            id: uuidv4(),
            user_id: userId,
            name: suggestedCategory,
            type,
            color: '#6366f1',
            icon: 'folder'
          });
          categoryMap[suggestedCategory] = newCat.id;
          categoryId = newCat.id;
        } else {
          // Use a default "Imported" category
          const defaultName = txn.type === 'income' ? 'Other Income' : 'Other Expenses';
          if (!categoryMap[defaultName]) {
            const newCat = await this.categoryRepository.create({
              id: uuidv4(),
              user_id: userId,
              name: defaultName,
              type: txn.type,
              color: '#94a3b8',
              icon: 'import'
            });
            categoryMap[defaultName] = newCat.id;
          }
          categoryId = categoryMap[defaultName];
        }

        const transaction = await this.transactionRepository.create({
          id: uuidv4(),
          user_id: userId,
          category_id: categoryId,
          amount: txn.amount,
          currency: defaultCurrency,
          type: txn.type,
          description: txn.description || 'Imported transaction',
          transaction_date: txn.date,
          is_recurring: false,
          recurring_frequency: null,
          notes: 'Imported from bank statement'
        });

        imported.push(transaction);
      } catch (err) {
        errors.push({ ...txn, error: err.message });
      }
    }

    return {
      summary: {
        total: parsedTransactions.length,
        imported: imported.length,
        skipped: skipped.length,
        errors: errors.length
      },
      imported,
      skipped,
      errors
    };
  }
}

module.exports = StatementService;
