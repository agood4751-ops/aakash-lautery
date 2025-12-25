const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

// Register
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

router.post('/register', async (req, res) => {
  const { name, email, country_code, phone, password, confirmPassword } = req.body;
  const fullPhone = country_code + phone;

  try {
    /* 1️⃣ Password confirmation (MANDATORY backend check) */
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/register');
    }

    /* 2️⃣ Check email OR phone already exists */
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR phone = ?',
      [email, fullPhone]
    );

    if (existing.length) {
      req.flash('error', 'Email or phone number already registered.');
      return res.redirect('/register');
    }

    /* 3️⃣ Hash password */
    const hash = await bcrypt.hash(password, 10);

    /* 4️⃣ Insert user */
    await db.query(
      `INSERT INTO users 
       (name, email, phone, password_hash, balance) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, fullPhone, hash, 0.00]
    );

    req.flash('success', 'Registration successful. Please login.');
    res.redirect('/login');

  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/register');
  }
});

// Login
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

router.post('/login', async (req, res) => {
  const { email, phone, password } = req.body;
  if ((!email && !phone) || !password) {
    req.flash('error', 'Please provide email or phone and password.');
    return res.redirect('/login');
  }
  console.log(req.body);
  try {
    let rows; // ✅ declare once

    if (phone) {
      [rows] = await db.query(
        'SELECT * FROM users WHERE phone = ?',
        [phone]
      );
    } else {
      [rows] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
    }

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
