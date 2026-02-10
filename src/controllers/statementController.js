const StatementService = require('../services/statementService');
const AnomalyService = require('../services/anomalyService');

const statementService = new StatementService();
const anomalyService = new AnomalyService();

class StatementController {
  /**
   * Parse and preview CSV bank statement without importing
   */
  async previewStatement(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a CSV file'
        });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const parsed = statementService.parseCSV(csvContent);

      // Auto-categorize each transaction
      const categorized = parsed.map(txn => ({
        ...txn,
        suggestedCategory: statementService.autoCategorize(txn.description)
      }));

      // Detect duplicates
      const withDuplicates = await statementService.detectDuplicates(req.user.id, categorized);

      res.json({
        success: true,
        message: `Parsed ${parsed.length} transactions from CSV`,
        data: {
          transactions: withDuplicates,
          summary: {
            total: withDuplicates.length,
            income: withDuplicates.filter(t => t.type === 'income').length,
            expenses: withDuplicates.filter(t => t.type === 'expense').length,
            duplicates: withDuplicates.filter(t => t.isDuplicate).length,
            categorized: withDuplicates.filter(t => t.suggestedCategory).length,
            uncategorized: withDuplicates.filter(t => !t.suggestedCategory).length,
            totalAmount: parseFloat(withDuplicates.reduce((s, t) => s + t.amount, 0).toFixed(2))
          }
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Import bank statement CSV into transactions
   */
  async importStatement(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a CSV file'
        });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const parsed = statementService.parseCSV(csvContent);

      // Auto-categorize
      const categorized = parsed.map(txn => ({
        ...txn,
        suggestedCategory: statementService.autoCategorize(txn.description)
      }));

      // Detect duplicates
      const withDuplicates = await statementService.detectDuplicates(req.user.id, categorized);

      // Import
      const skipDuplicates = req.body.skipDuplicates !== 'false';
      const defaultCurrency = req.body.currency || 'USD';

      const result = await statementService.importTransactions(req.user.id, withDuplicates, {
        skipDuplicates,
        defaultCurrency
      });

      res.json({
        success: true,
        message: `Imported ${result.summary.imported} of ${result.summary.total} transactions`,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

class AnomalyController {
  /**
   * Get spending anomalies for the authenticated user
   */
  async getAnomalies(req, res) {
    try {
      const { days = 90, threshold = 2.0 } = req.query;

      const result = await anomalyService.detectAnomalies(req.user.id, {
        lookbackDays: parseInt(days),
        zScoreThreshold: parseFloat(threshold)
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to detect anomalies',
        error: error.message
      });
    }
  }
}

module.exports = {
  statementController: new StatementController(),
  anomalyController: new AnomalyController()
};
