// services/financialService.js
const { db } = require('../common/initializer');
const logger = require('../common/logger');

class FinancialService {
  // Add a new financial transaction
 addTransaction(transactionData) {
    const { transaction_type, category, amount, description } = transactionData;

    // Validate all required fields
    if (!transaction_type || !category || !amount || !description) {
      throw new Error('All fields are required: transaction_type, category, amount, description');
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO expenses (description, amount, category, transaction_type)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(description, amount, category, transaction_type);
      return result.changes === 1;
    } catch (error) {
      logger.error('Error adding transaction:', error);
      throw error;
    }
  }

  // Get monthly summary
  getMonthlySummary(month) {
    try {
      // Format: YYYY-MM
      const startDate = new Date(month + '-01');
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const revenue = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM financial_transactions
        WHERE transaction_type = 'income'
        AND transaction_date >= ? AND transaction_date < ?
      `).get(startDate.toISOString(), endDate.toISOString());

      const expenses = db.prepare(`
        SELECT category, COALESCE(SUM(amount), 0) as total
        FROM financial_transactions
        WHERE transaction_type = 'expense'
        AND transaction_date >= ? AND transaction_date < ?
        GROUP BY category
      `).all(startDate.toISOString(), endDate.toISOString());

      return {
        month,
        revenue: revenue.total,
        expenses,
        profit: revenue.total - expenses.reduce((acc, exp) => acc + exp.total, 0)
      };
    } catch (error) {
      logger.error('Error getting monthly summary:', error);
      throw error;
    }
  }

  // Get total revenue since start
  getTotalRevenue() {
    try {
      return db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM financial_transactions
        WHERE transaction_type = 'income'
      `).get();
    } catch (error) {
      logger.error('Error getting total revenue:', error);
      throw error;
    }
  }

  // Generate transaction report
generateTransactionReport(startDate, endDate) {
    try {
      // Get total revenue
      const totalRevenue = db.prepare(`
        SELECT SUM(amount) as total FROM payments
      `).get().total || 0;

      // Get operational costs
      const operationalCosts = db.prepare(`
        SELECT SUM(amount) as total FROM expenses
      `).get().total || 0;

      // Calculate profit
      const profit = totalRevenue - operationalCosts;

      // Get monthly breakdown
      const monthlyBreakdown = db.prepare(`
        SELECT 
          strftime('%Y-%m', payment_date) as month,
          SUM(amount) as totalRevenue,
          0 as outstandingAmount,
          (
            SELECT COALESCE(SUM(amount), 0)
            FROM expenses
            WHERE strftime('%Y-%m', date) = strftime('%Y-%m', payments.payment_date)
          ) as operationalCost
        FROM payments
        GROUP BY strftime('%Y-%m', payment_date)
        ORDER BY month DESC
        LIMIT 12
      `).all().map(row => ({
        ...row,
        profit: row.totalRevenue - row.operationalCost
      }));

      // Get recent transactions
      const recentTransactions = db.prepare(`
        SELECT 
          payment_date as date,
          'Subscription Payment' as description,
          'income' as type,
          amount
        FROM payments
        UNION ALL
        SELECT 
          date,
          description,
          'expense' as type,
          amount
        FROM expenses
        ORDER BY date DESC
        LIMIT 10
      `).all();

      return {
        totalRevenue,
        operationalCost: operationalCosts,
        profit,
        outstandingAmount: 0, // You can implement this based on your business logic
        monthlyBreakdown,
        recentTransactions
      };
    } catch (error) {
      throw new Error('Error generating financial report: ' + error.message);
    }
  }
}

module.exports = new FinancialService();