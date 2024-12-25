const { db } = require('../common/initializer');

class DashboardService {
  getFinancialSummary() {
    try {
      // Get total revenue from payments
      const revenue = db.prepare(`
        SELECT SUM(amount) as total
        FROM payments
      `).get();

      // Get total operational costs
      const costs = db.prepare(`
        SELECT SUM(amount) as total
        FROM expenses
      `).get();

      // Calculate totals
      const totalRevenue = revenue.total || 0;
      const operationalCosts = costs.total || 0;
      const profit = totalRevenue - operationalCosts;

      return {
        totalRevenue,
        operationalCosts,
        profit,
        outstandingAmount: 0 // Implement based on your business logic
      };
    } catch (error) {
      throw new Error('Error getting financial summary: ' + error.message);
    }
  }
}

module.exports = new DashboardService();