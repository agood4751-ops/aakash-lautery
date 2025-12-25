const express = require('express');
const db = require('../config/db');
const { ensureAuth } = require('../middleware/auth');

const router = express.Router();

// Number game page
router.get('/play/number', ensureAuth, async (req, res) => {
  // get open draw for NUMBER
  const [rows] = await db.query(
    `SELECT d.*, gt.name AS game_name
     FROM draws d
     JOIN game_types gt ON d.game_type_id = gt.id
     WHERE gt.code = 'NUMBER' AND d.is_closed = 0
     ORDER BY d.draw_time ASC
     LIMIT 1`
  );
  const draw = rows[0] || null;
  res.render('games/number', { title: 'Play Number Game', draw });
});

// Place number bet
router.post('/play/number', ensureAuth, async (req, res) => {
  const { chosen_number, draw_id, amount } = req.body;
  const userId = req.session.user.id;

  try {
    const betAmount = parseInt(amount);

    // 1️⃣ Validation
    if (!Number.isInteger(betAmount) || betAmount < 1 || betAmount > 100) {
      req.flash('error', 'Amount must be between 1 and 100.');
      return res.redirect('/play/number');
    }

    if (chosen_number < 1 || chosen_number > 100) {
      req.flash('error', 'Choose a number between 1 and 100.');
      return res.redirect('/play/number');
    }

    // 2️⃣ User balance
    const [[user]] = await db.query(
      'SELECT balance FROM users WHERE id = ?',
      [userId]
    );

    if (user.balance < betAmount) {
      req.flash('error', 'Insufficient balance.');
      return res.redirect('/play/number');
    }

    // 3️⃣ User ticket limit
    const [[userTicketData]] = await db.query(
      `SELECT COUNT(*) AS count
       FROM bets
       WHERE user_id = ? AND draw_id = ?`,
      [userId, draw_id]
    );

    if (userTicketData.count >= 5) {
      req.flash('error', 'You can buy max 5 tickets per draw.');
      return res.redirect('/play/number');
    }

    // 4️⃣ Draw ticket limit
    const [[drawTicketData]] = await db.query(
      `SELECT COUNT(*) AS count
       FROM bets
       WHERE draw_id = ?`,
      [draw_id]
    );

    if (drawTicketData.count >= 80) {
      req.flash('error', 'All tickets sold for this draw.');
      return res.redirect('/play/number');
    }

    // 5️⃣ Insert tickets
    const payout = betAmount * 70;
    await db.query(
      `INSERT INTO bets
      (user_id, draw_id, amount, chosen_number, status, payout, game_type_id)
      VALUES (?, ?, ?, ?, 'PENDING', ?, 1)`,
      [userId, draw_id, betAmount, chosen_number, payout]
    );

    // 6️⃣ Deduct balance
    await db.query(
      'UPDATE users SET balance = balance - ? WHERE id = ?',
      [betAmount, userId]
    );

    req.flash(
      'success',
      `Bet placed! 1 ticket(s) purchased. Win amount per ticket: AED ${payout}`
    );
    res.redirect('/play/number');

  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/play/number');
  }
});



// Color game page
router.get('/play/color', ensureAuth, async (req, res) => {
  const [rows] = await db.query(
    `SELECT d.*, gt.name AS game_name
     FROM draws d
     JOIN game_types gt ON d.game_type_id = gt.id
     WHERE gt.code = 'COLOR' AND d.is_closed = 0
     ORDER BY d.draw_time ASC
     LIMIT 1`
  );
  const draw = rows[0] || null;
  res.render('games/color', { title: 'Play Color Game', draw });
});

// Place color bet
router.post('/play/color', ensureAuth, async (req, res) => {
  const { chosen_color, amount, draw_id } = req.body;
  const userId = req.session.user.id;

  try {
    const [users] = await db.query('SELECT balance FROM users WHERE id = ?', [userId]);
    const balance = parseFloat(users[0].balance);
    const betAmount = parseFloat(amount);

    if (betAmount <= 0 || betAmount > balance) {
      req.flash('error', 'Invalid amount or insufficient balance.');
      return res.redirect('/play/color');
    }

    await db.query(
      'INSERT INTO bets (user_id, draw_id, amount, chosen_color) VALUES (?, ?, ?, ?)',
      [userId, draw_id, betAmount, chosen_color]
    );

    await db.query('UPDATE users SET balance = balance - ? WHERE id = ?', [betAmount, userId]);

    req.flash('success', 'Bet placed successfully!');
    res.redirect('/play/color');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/play/color');
  }
});

router.get('/play/myBets', ensureAuth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const [bets] = await db.query(
      `SELECT * FROM bets WHERE user_id = ? ORDER BY placed_at DESC`,
      [userId]
    );

    res.render('games/myBets', {
      title: 'My Bets',
      bets
    });

  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not retrieve your bets.');
    res.redirect('/');
  }
});

// Number game page
router.get('/play/numberGame2', ensureAuth, async (req, res) => {
  // get open draw for NUMBER
  const [rows] = await db.query(
    `SELECT d.*, gt.name AS game_name
     FROM draws d
     JOIN game_types gt ON d.game_type_id = gt.id
     WHERE gt.code = 'NUMBER50' AND d.is_closed = 0
     ORDER BY d.draw_time ASC
     LIMIT 1`
  );
  const draw = rows[0] || null;
  res.render('games/numberGame2', { title: 'Play Number 50 Game', draw });
});

router.post('/play/numberGame2', ensureAuth, async (req, res) => {
  const { draw_id, chosen_number, amount } = req.body;
  const userId = req.session.user.id;

  try {
    const betAmount = parseInt(amount);

    // 🔒 Validations
    if (!Number.isInteger(betAmount) || betAmount < 2 || betAmount > 200) {
      req.flash('error', 'Amount must be between AED 2 and 200.');
      return res.redirect('/play/numberGame2');
    }

    if (chosen_number < 1 || chosen_number > 50) {
      req.flash('error', 'Choose a number between 1 and 50.');
      return res.redirect('/play/numberGame2');
    }

    // 👤 User balance
    const [[user]] = await db.query(
      'SELECT balance FROM users WHERE id = ?',
      [userId]
    );

    if (user.balance < betAmount) {
      req.flash('error', 'Insufficient balance.');
      return res.redirect('/play/numberGame2');
    }

    // 🎟 User ticket limit
    const [[userTickets]] = await db.query(
      `SELECT COUNT(*) AS count
       FROM bets WHERE user_id = ? AND draw_id = ?`,
      [userId, draw_id]
    );

    if (userTickets.count >= 5) {
      req.flash('error', 'You can buy max 5 tickets per draw.');
      return res.redirect('/play/numberGame2');
    }

    // 🎯 Draw ticket limit (40)
    const [[drawTickets]] = await db.query(
      `SELECT COUNT(*) AS count
       FROM bets WHERE draw_id = ?`,
      [draw_id]
    );

    if (drawTickets.count >= 40) {
      req.flash('error', 'All tickets sold for this draw.');
      return res.redirect('/play/numberGame2');
    }

    // 💰 Insert bets
    const payout = betAmount * 40;

    await db.query(
        `INSERT INTO bets
        (user_id, draw_id, amount, chosen_number, status, payout, game_type_id)
        VALUES (?, ?, ?, ?, 'PENDING', ?, 3)`,
        [userId, draw_id, betAmount, chosen_number, payout]
      );

    // 💳 Deduct balance
    await db.query(
      'UPDATE users SET balance = balance - ? WHERE id = ?',
      [betAmount, userId]
    );

    req.flash(
      'success',
      `Bet placed! 1 ticket(s). Win AED ${payout} per ticket.`
    );
    res.redirect('/play/numberGame2');

  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/play/numberGame2');
  }
});

router.get('/play/results', ensureAuth, async(req, res) => {
    try {
    const [results] = await db.query(
      `SELECT 
          d.id,
          d.game_type_id,
          d.draw_time,
          d.winning_number,
          g.code,
          g.name
      FROM draws AS d
      LEFT JOIN game_types AS g ON d.game_type_id = g.id
      WHERE d.winning_number > 0
      LIMIT 0, 1000;`,
    );
    console.log(results);

    res.render('games/results', {
      title: 'Results',
      results
    });

  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not retrieve your bets.');
    res.redirect('/');
  }
});

router.get('/play/FAQs', ensureAuth, (req, res) => {
  res.render('games/FAQs', { title: 'FAQs' });
});

router.get('/play/rules', ensureAuth, (req, res) => {
  res.render('games/rules', { title: 'Rules' });
});

router.get('/play/myProfile', ensureAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const [rows] = await db.query(
      "SELECT id, name, email, is_admin, balance, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (!rows.length) {
      req.flash('error', 'User not found');
      return res.redirect('/');
    }

    const user = rows[0];

    res.render('games/myProfile', {
      title: 'My Profile',
      user
    });

  } catch (err) {
    req.flash('error', 'Unable to load profile');
    res.redirect('/');
  }
});



module.exports = router;
