const express = require('express');
const db = require('../config/db');
const { ensureAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin dashboard
router.get('/', ensureAdmin, async (req, res) => {
  const [[{ userCount }]] = await db.query('SELECT COUNT(*) AS userCount FROM users');
  const [[{ betCount }]] = await db.query('SELECT COUNT(*) AS betCount FROM bets');
  res.render('admin/dashboard', { title: 'Admin Dashboard', userCount, betCount });
});

// List draws
router.get('/draws', ensureAdmin, async (req, res) => {
  const [rows] = await db.query(
    `SELECT d.*, gt.name AS game_name, gt.code
     FROM draws d
     JOIN game_types gt ON d.game_type_id = gt.id
     ORDER BY d.draw_time DESC`
  );
  res.render('admin/draws', { title: 'Manage Draws', draws: rows });
});

// Create draw
router.post('/draws', ensureAdmin, async (req, res) => {
  const { game_type_code, draw_time } = req.body;
  try {
    const [gt] = await db.query('SELECT id FROM game_types WHERE code = ?', [game_type_code]);
    if (!gt.length) {
      req.flash('error', 'Invalid game type.');
      return res.redirect('/admin/draws');
    }
    await db.query(
      'INSERT INTO draws (game_type_id, draw_time) VALUES (?, ?)',
      [gt[0].id, draw_time]
    );
    req.flash('success', 'Draw created.');
    res.redirect('/admin/draws');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error creating draw.');
    res.redirect('/admin/draws');
  }
});

// Declare result (announce winner)
router.post('/draws/:id/close', ensureAdmin, async (req, res) => {
  const drawId = req.params.id;
  const { winning_number, winning_color } = req.body;

  try {
    // Get draw & game type
    const [d] = await db.query(
      `SELECT d.*, gt.code AS game_code
       FROM draws d
       JOIN game_types gt ON d.game_type_id = gt.id
       WHERE d.id = ?`,
      [drawId]
    );
    if (!d.length) {
      req.flash('error', 'Draw not found.');
      return res.redirect('/admin/draws');
    }
    const draw = d[0];

    // Update draw with result
    await db.query(
      'UPDATE draws SET winning_number = ?, winning_color = ?, is_closed = 1 WHERE id = ?',
      [winning_number || null, winning_color || null, drawId]
    );

    // Fetch bets for this draw
    const [bets] = await db.query('SELECT * FROM bets WHERE draw_id = ?', [drawId]);

    for (const bet of bets) {
      let status = 'LOST';
      let payout = 0;

      if (draw.game_code === 'NUMBER') {
        if (bet.chosen_number !== null && winning_number && bet.chosen_number == winning_number) {
          status = 'WON';
          payout = bet.amount * 10;
        }
      } else if (draw.game_code === 'COLOR') {
        if (bet.chosen_color && winning_color && bet.chosen_color === winning_color) {
          status = 'WON';
          payout = bet.amount * 2;
        }
      }

      await db.query(
        'UPDATE bets SET status = ?, payout = ? WHERE id = ?',
        [status, payout, bet.id]
      );

      if (status === 'WON' && payout > 0) {
        await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [
          payout,
          bet.user_id,
        ]);
      }
    }

    req.flash('success', 'Result declared and winners updated!');
    res.redirect('/admin/draws');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error closing draw.');
    res.redirect('/admin/draws');
  }
});

module.exports = router;
