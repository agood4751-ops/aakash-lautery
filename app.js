const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const flash = require('connect-flash');
const methodOverride = require('method-override');
const db = require('./config/db');
const expressLayouts = require('express-ejs-layouts');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const adminRoutes = require('./routes/admin');

const app = express();

// Session store
const sessionStore = new MySQLStore({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Faizan@123',
    database: 'lottery_app'
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts);
app.set('layout', 'layouts/layout');
// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(
  session({
    key: 'lottery_session',
    secret: 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { maxAge: 86400000 } // 1 day
  })
);

app.use(flash());

// Global vars for views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/', gameRoutes);
app.use('/admin', adminRoutes);

// Home route
app.get('/', async (req, res) => {
  res.render('index', { title: 'Home' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Lottery app running on http://localhost:${PORT}`));
