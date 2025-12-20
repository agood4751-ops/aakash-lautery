const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

// Register
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      req.flash('error', 'Email already registered.');
      return res.redirect('/register');
    }

    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (name, email, password_hash, balance) VALUES (?, ?, ?, ?)',
      [name, email, hash, 1000.0] // give some starting balance
    );

    req.flash('success', 'Registration successful. Please login.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/register');
  }
});

// Login
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      req.flash('error', 'Invalid credentials.');
      return res.redirect('/login');
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      req.flash('error', 'Invalid credentials.');
      return res.redirect('/login');
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: !!user.is_admin,
      balance: user.balance,
    };

    req.flash('success', 'Welcome back!');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/login');
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
