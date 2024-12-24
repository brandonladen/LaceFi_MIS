const jwt = require('jsonwebtoken');
const { loadEnvConfig } = require('../configs/env');
const { db } = require('../common/initializer');

loadEnvConfig();
const JWT_SECRET = process.env.JWT_SECRET;


const authenticateToken = (req, res, next) => {
    const token = req.session.token; // Ensure session contains the token
    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.redirect('/login');
        }

        // Fetch user role from the database
        const userData = db.prepare('SELECT role FROM users WHERE id = ?').get(user.id);
        
        // Attach role to the user object
        req.user = { ...user, role: userData ? userData.role : 'user' }; // Default to 'user' if no role is found

        next();
    });
};

// Middleware to check if the user has a super admin role
function checkSuperAdmin(req, res, next) {
    const userId = req.user.id; // Assuming the user ID is stored in the request after authentication
    
    // Query the database to get the role of the user
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
  
    if (!user || user.role !== 'super admin') {
      return res.status(403).json({ message: 'Permission denied' });
    }
  
    next(); // Proceed to the next middleware/route handler if the user is a super admin
  }
  

module.exports = { authenticateToken, checkSuperAdmin };