const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const subscriptionService = require('../services/subsctiptionService');
const { db } = require('../common/initializer');
const logger = require('../common/logger');

// Get all subscribers with filters applied
router.get('/', async (req, res) => {
    const { routerName, subscriptionType } = req.query;
    
    try {
        const routerNames = db.prepare('SELECT DISTINCT router_name FROM subscribers').all();
        const subscriptionTypes = ['monthly', 'weekly'];
        
        let query = 'SELECT * FROM subscribers WHERE 1=1';
        let params = [];
        
        if (routerName) {
            query += ' AND router_name = ?';
            params.push(routerName);
        }
        if (subscriptionType) {
            query += ' AND subscription_type = ?';
            params.push(subscriptionType);
        }
        
        const subscribers = db.prepare(query).all(...params);
        const totalAmount = subscribers.reduce((total, sub) => total + sub.amount, 0);
        
        res.render('subscriptions/list', {
            subscribers,
            totalAmount,
            routerNames,
            subscriptionTypes,
            routerName,
            subscriptionType,
            userRole: req.user?.role || 'user' // Pass the user role from auth middleware
        });
    } catch (error) {
        logger.error('Error fetching subscriptions:', error);
        res.status(500).render('error', { 
            message: 'Failed to fetch subscriptions', 
            error: error.message 
        });
    }
});

  // Create new subscription
router.post('/', [
    body('name').notEmpty().trim(),
    body('phone_number').notEmpty().trim(),
    body('payment_code').notEmpty().trim(),
    body('amount').isInt({ min: 1 }),
    body('payment_date').notEmpty(),
    body('router_name').notEmpty().trim(),
    body('router_location').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await subscriptionService.createSubscription(req.body);
        res.redirect('/subscriptions');
    } catch (error) {
        logger.error('Error creating subscription:', error);
        res.status(500).render('error', { 
            message: 'Failed to create subscription',
            error: error.message 
        });
    }
});
  

// Edit subscription
router.post('/edit/:id', [
  body('name').notEmpty().trim(),
  body('phone_number').notEmpty().trim(),
  body('payment_code').notEmpty().trim(),
  body('amount').isInt({ min: 1 }),
  body('subscription_type').notEmpty(),
  body('payment_date').notEmpty(),
  body('subscription_end_date').notEmpty(),
  body('router_name').notEmpty(),
  body('router_location').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = req.params.id;
    const success = await subscriptionService.updateSubscription(id, req.body);
    
    if (success) {
      res.redirect('/subscriptions');
    } else {
      throw new Error('Subscription not found');
    }
  } catch (error) {
    logger.error('Error updating subscription:', error);
    res.status(500).render('error', { 
      message: 'Failed to update subscription', 
      error: error.message 
    });
  }
});

// Delete subscription
router.post('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const success = await subscriptionService.deleteSubscription(id);
    
    if (success) {
      res.redirect('/subscriptions');
    } else {
      throw new Error('Subscription not found');
    }
  } catch (error) {
    logger.error('Error deleting subscription:', error);
    res.status(500).render('error', { 
      message: 'Failed to delete subscription', 
      error: error.message 
    });
  }
});

module.exports = router;