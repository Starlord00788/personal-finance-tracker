const ReportService = require('../services/reportService');

const reportService = new ReportService();

class ReportController {
  async getMonthlyReport(req, res) {
    try {
      const { year, month } = req.params;
      const report = await reportService.getMonthlyReport(
        req.user.id,
        parseInt(year),
        parseInt(month)
      );

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate monthly report',
        error: error.message
      });
    }
  }

  async getYearlyReport(req, res) {
    try {
      const { year } = req.params;
      const report = await reportService.getYearlyReport(req.user.id, parseInt(year));

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate yearly report',
        error: error.message
      });
    }
  }

  async getCustomReport(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate query parameters are required'
        });
      }

      const report = await reportService.getCustomReport(req.user.id, startDate, endDate);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate custom report',
        error: error.message
      });
    }
  }
}

module.exports = new ReportController();
