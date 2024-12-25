const express = require('express');
const router = express.Router();
const subscriptionRoutes = require('./subscriptionRoutes');
const subscriptionService = require('../services/subsctiptionService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../common/initializer');
const { authenticateToken, checkSuperAdmin }  = require('../middlewares/authMiddleware');
const financialRoutes = require('./financialRoutes');
const { loadEnvConfig } = require('../configs/env');
loadEnvConfig();

const JWT_SECRET = process.env.JWT_SECRET;

router.get('/', (req, res) => {
    res.redirect('/login');
});

// Landing page
router.get('/home', authenticateToken, async (req, res) => {
    try {
        const financialSummary = subscriptionService.getFinancialSummary();
        res.render('landing', {
            activeUsers: (financialSummary.weekly.count + financialSummary.monthly.count) || 0,
            revenue: financialSummary.total || 0,
            weeklyPlans: financialSummary.weekly.count || 0,
            monthlyPlans: financialSummary.monthly.count || 0,
        });
    } catch (error) {
        console.error('Error fetching financial summary:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Subscription form page
router.get('/subscribe', authenticateToken, (req, res) => {
    res.render('subscribe');
});

// GET route to render the edit form
router.get('/subscriptions/edit/:id', authenticateToken, async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const subscription = subscriptionService.getSubscriptionById(subscriptionId);
        if (!subscription) {
            return res.status(404).render('error', { message: 'Subscription not found' });
        }
        res.render('editSubscription', { subscription });
    } catch (error) {
        res.status(500).render('error', { message: 'Error fetching subscription' });
    }
});

// POST route to update the subscription
router.post('/subscriptions/edit/:id', authenticateToken, async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const success = await subscriptionService.updateSubscription(subscriptionId, req.body);
        if (!success) {
            return res.status(404).render('error', { message: 'Subscription not found' });
        }
        res.redirect('/subscriptions');
    } catch (error) {
        res.status(500).render('error', { message: 'Error updating subscription' });
    }
});

// POST route to delete the subscription
router.post('/subscriptions/delete/:id', authenticateToken, async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const success = await subscriptionService.deleteSubscription(subscriptionId);
        if (!success) {
            return res.status(404).render('error', { message: 'Subscription not found' });
        }
        res.redirect('/subscriptions');
    } catch (error) {
        res.status(500).render('error', { message: 'Error deleting subscription' });
    }
});

// Use subscription routes
router.use('/subscriptions', authenticateToken, subscriptionRoutes);

router.use('/F', authenticateToken, financialRoutes);

// Render the login page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Handle login form submission
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.render('login', { error: 'Email and password are required' });
    }

    try {
        // Check if the user exists
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const user = stmt.get(email); // Fetch the user from the database

        if (!user) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        // Store token in the session or redirect with token
        req.session.token = token; // Ensure `express-session` is configured
        res.redirect('/home'); // Redirect to the landing page or dashboard
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).render('login', { error: 'Internal Server Error' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.redirect('/login');
    });
});


module.exports = router;