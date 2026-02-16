const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');

const router = express.Router();

function normalizePhone(countryCode, phone) {
  const c = (countryCode || '').trim();
  const p = (phone || '').replace(/\s+/g, '');
  return c && p ? `${c}${p}` : null;
}

router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

router.post('/register', async (req, res) => {
  const { name, email, country_code, phone, password, confirmPassword } = req.body;

  try {
    if (!name || !email || !country_code || !phone || !password || !confirmPassword) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/register');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/register');
    }

    const fullPhone = normalizePhone(country_code, phone);
    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: fullPhone }],
      },
      select: { id: true },
    });

    if (existing) {
      req.flash('error', 'Email or phone number already registered.');
      return res.redirect('/register');
    }

    const hash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        phone: fullPhone,
        passwordHash: hash,
        balance: 0,
      },
    });

    req.flash('success', 'Registration successful. Please login.');
    return res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong. Please try again.');
    return res.redirect('/register');
  }
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

router.post('/login', async (req, res) => {
  const { email, phone, password } = req.body;

  if ((!email && !phone) || !password) {
    req.flash('error', 'Please provide email or phone and password.');
    return res.redirect('/login');
  }

  try {
    let user = null;

    if (phone) {
      const normalizedPhone = String(phone).trim();
      user = await prisma.user.findFirst({
        where: normalizedPhone.startsWith('+')
          ? { phone: normalizedPhone }
          : { phone: { endsWith: normalizedPhone } },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { email: String(email).trim().toLowerCase() },
      });
    }

    if (!user) {
      req.flash('error', 'Invalid credentials.');
      return res.redirect('/login');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      req.flash('error', 'Invalid credentials.');
      return res.redirect('/login');
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: Boolean(user.isAdmin),
      balance: Number(user.balance),
    };

    req.flash('success', 'Welcome back!');
    return res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong.');
    return res.redirect('/login');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;