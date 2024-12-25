// routes/financialRoutes.js
const express = require('express');
const router = express.Router();
const financialService = require('../services/financialService');
const { checkSuperAdmin } = require('../middlewares/authMiddleware');
const { db } = require('../common/initializer')

// Get financial dashboard
router.get('/dashboard', async (req, res) => {
    try {
      // Get financial summary
      const financialSummary = db.prepare(`
        SELECT 
          SUM(amount) as totalRevenue
        FROM payments
      `).get();
  
      const operationalCosts = db.prepare(`
        SELECT SUM(amount) as total
        FROM expenses
      `).get();
  
      // Calculate metrics
      const summary = {
        totalRevenue: financialSummary.totalRevenue || 0,
        operationalCosts: operationalCosts.total || 0,
        profit: (financialSummary.totalRevenue || 0) - (operationalCosts.total || 0),
        outstandingAmount: (financialSummary.totalRevenue || 0) - (operationalCosts.total || 0)
      };
  
      res.render('financial/dashboard', { 
        totalRevenue: summary.totalRevenue,
        operationalCosts: summary.operationalCosts,
        profit: summary.profit,
        outstandingAmount: summary.outstandingAmount
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).render('error', { 
        message: 'Error loading dashboard',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  });

  router.post('/transactions', async (req, res) => {
    try {
      const success = await financialService.addTransaction(req.body);
      
      if (success) {
        res.redirect('/F/dashboard');
      } else {
        throw new Error('Failed to add transaction');
      }
    } catch (error) {
      res.status(500).render('error', {
        message: 'Error adding transaction',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
      });
    }
  });

// routes/financialRoutes.js
router.get('/report', async (req, res) => {
    try {
      const report = financialService.generateTransactionReport();
      
      // Ensure all required properties exist
      const safeReport = {
        totalRevenue: report.totalRevenue || 0,
        operationalCost: report.operationalCost || 0,
        profit: report.profit || 0,
        outstandingAmount: report.profit || 0,
        monthlyBreakdown: report.monthlyBreakdown || [],
        recentTransactions: report.recentTransactions || [],
        userRole: req.user?.role || 'user'
      };
  
      if (req.query.format === 'csv') {
        const csv = convertToCSV(safeReport);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        return res.send(csv);
      }
  
      res.render('financial/report', { transactions: safeReport });
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).render('error', { 
        message: 'Error generating report',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  });
  

module.exports = router;
