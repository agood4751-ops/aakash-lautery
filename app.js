require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const { Pool } = require('pg');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const adminRoutes = require('./routes/admin');
const walletRoutes = require('./routes/wallet');
const withdrawRoutes = require('./routes/withdraw');

const app = express();

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required in environment variables.');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in environment variables.');
}

const PgSession = connectPgSimple(session);
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

const sessionStore = new PgSession({
  pool: pgPool,
  tableName: 'user_sessions',
  createTableIfMissing: true,
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts);
app.set('layout', 'layouts/layout');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(
  session({
    key: 'lottery_session',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use('/', authRoutes);
app.use('/', gameRoutes);
app.use('/wallet', walletRoutes);
app.use('/withdraw', withdrawRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 6000;

  app.listen(PORT, () => {
    console.log(`Lottery app running on http://localhost:${PORT}`);
  });
}

module.exports = app;
