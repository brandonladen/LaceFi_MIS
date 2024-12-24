const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const loggerMiddleware = require('./middlewares/loggerMiddleware');
const { initializeDatabase } = require('./common/initializer');
const session = require('express-session');
const { loadEnvConfig } = require('./configs/env');
loadEnvConfig();

const app = express();

// Initialize database
initializeDatabase();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(loggerMiddleware);

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true }, // Set to true if using HTTPS
    })
);


// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static('public'));

// Routes
app.use('/', routes);

// Error handling


app.use(errorMiddleware);

module.exports = app;