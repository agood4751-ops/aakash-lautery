const express = require('express');
const prisma = require('../config/prisma');
const { ensureAuth } = require('../middleware/auth');
const { GAME_CONFIG, ALLOWED_COLORS } = require('../lib/gameConfig');

const router = express.Router();

function toInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function toAmount(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function getOpenDrawByCode(code) {
  const draw = await prisma.draw.findFirst({
    where: {
      isClosed: false,
      gameType: { code },
    },
    include: { gameType: true },
    orderBy: { drawTime: 'asc' },
  });

  if (!draw) return null;

  return {
    id: draw.id,
    draw_time: draw.drawTime,
    draw_code: draw.drawCode,
    game_type_id: draw.gameTypeId,
    game_name: draw.gameType.name,
    code: draw.gameType.code,
  };
}

router.get('/play/number', ensureAuth, async (req, res) => {
  const draw = await getOpenDrawByCode('NUMBER');
  res.render('games/number', { title: 'Play Number Game', draw });
});

router.post('/play/number', ensureAuth, async (req, res) => {
  const { chosen_number, draw_id, amount } = req.body;
  const userId = req.session.user.id;
  const config = GAME_CONFIG.NUMBER;

  try {
    const chosenNumber = toInt(chosen_number);
    const drawId = toInt(draw_id);
    const betAmount = toInt(amount);

    if (!drawId || !chosenNumber) {
      req.flash('error', 'Draw and number are required.');
      return res.redirect('/play/number');
    }

    if (!betAmount || betAmount < config.minAmount || betAmount > config.maxAmount) {
      req.flash('error', `Amount must be between ${config.minAmount} and ${config.maxAmount}.`);
      return res.redirect('/play/number');
    }

    if (chosenNumber < config.minChoice || chosenNumber > config.maxChoice) {
      req.flash('error', `Choose a number between ${config.minChoice} and ${config.maxChoice}.`);
      return res.redirect('/play/number');
    }

    const payout = betAmount * config.multiplier;

    await prisma.$transaction(async (tx) => {
      const draw = await tx.draw.findFirst({
        where: { id: drawId, isClosed: false, gameType: { code: config.code } },
      });

      if (!draw) {
        throw new Error('DRAW_NOT_OPEN');
      }

      const [userTicketCount, drawTicketCount] = await Promise.all([
        tx.bet.count({ where: { userId, drawId } }),
        tx.bet.count({ where: { drawId } }),
      ]);

      if (userTicketCount >= config.perUserLimit) {
        throw new Error('USER_LIMIT_REACHED');
      }

      if (drawTicketCount >= config.drawLimit) {
        throw new Error('DRAW_SOLD_OUT');
      }

      const debitResult = await tx.user.updateMany({
        where: {
          id: userId,
          balance: { gte: betAmount },
        },
        data: {
          balance: { decrement: betAmount },
        },
      });

      if (debitResult.count !== 1) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      await tx.bet.create({
        data: {
          userId,
          drawId,
          amount: betAmount,
          chosenNumber,
          status: 'PENDING',
          payout,
          gameTypeId: draw.gameTypeId,
        },
      });
    });

    req.session.user.balance = Number(req.session.user.balance || 0) - betAmount;
    req.flash('success', `Bet placed! Win amount per ticket: AED ${payout}`);
    return res.redirect('/play/number');
  } catch (err) {
    if (err.message === 'DRAW_NOT_OPEN') {
      req.flash('error', 'This draw is closed or invalid.');
    } else if (err.message === 'USER_LIMIT_REACHED') {
      req.flash('error', 'You can buy max 5 tickets per draw.');
    } else if (err.message === 'DRAW_SOLD_OUT') {
      req.flash('error', 'All tickets sold for this draw.');
    } else if (err.message === 'INSUFFICIENT_BALANCE') {
      req.flash('error', 'Insufficient balance.');
    } else {
      console.error(err);
      req.flash('error', 'Something went wrong.');
    }
    return res.redirect('/play/number');
  }
});

router.get('/play/color', ensureAuth, async (req, res) => {
  const draw = await getOpenDrawByCode('COLOR');
  res.render('games/color', { title: 'Play Color Game', draw });
});

router.post('/play/color', ensureAuth, async (req, res) => {
  const { chosen_color, amount, draw_id } = req.body;
  const userId = req.session.user.id;
  const config = GAME_CONFIG.COLOR;

  try {
    const drawId = toInt(draw_id);
    const betAmount = toAmount(amount);
    const chosenColor = String(chosen_color || '').toUpperCase();

    if (!drawId || !betAmount || !ALLOWED_COLORS.includes(chosenColor)) {
      req.flash('error', 'Invalid draw, amount or color.');
      return res.redirect('/play/color');
    }

    if (betAmount < config.minAmount || betAmount > config.maxAmount) {
      req.flash('error', `Amount must be between ${config.minAmount} and ${config.maxAmount}.`);
      return res.redirect('/play/color');
    }

    const payout = Number((betAmount * config.multiplier).toFixed(2));

    await prisma.$transaction(async (tx) => {
      const draw = await tx.draw.findFirst({
        where: { id: drawId, isClosed: false, gameType: { code: config.code } },
      });

      if (!draw) {
        throw new Error('DRAW_NOT_OPEN');
      }

      const [userTicketCount, drawTicketCount] = await Promise.all([
        tx.bet.count({ where: { userId, drawId } }),
        tx.bet.count({ where: { drawId } }),
      ]);

      if (userTicketCount >= config.perUserLimit) {
        throw new Error('USER_LIMIT_REACHED');
      }

      if (drawTicketCount >= config.drawLimit) {
        throw new Error('DRAW_SOLD_OUT');
      }

      const debitResult = await tx.user.updateMany({
        where: {
          id: userId,
          balance: { gte: betAmount },
        },
        data: {
          balance: { decrement: betAmount },
        },
      });

      if (debitResult.count !== 1) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      await tx.bet.create({
        data: {
          userId,
          drawId,
          amount: betAmount,
          chosenColor,
          status: 'PENDING',
          payout,
          gameTypeId: draw.gameTypeId,
        },
      });
    });

    req.session.user.balance = Number(req.session.user.balance || 0) - betAmount;
    req.flash('success', 'Color bet placed successfully!');
    return res.redirect('/play/color');
  } catch (err) {
    if (err.message === 'DRAW_NOT_OPEN') {
      req.flash('error', 'This draw is closed or invalid.');
    } else if (err.message === 'USER_LIMIT_REACHED') {
      req.flash('error', 'You can buy max 5 tickets per draw.');
    } else if (err.message === 'DRAW_SOLD_OUT') {
      req.flash('error', 'All tickets sold for this draw.');
    } else if (err.message === 'INSUFFICIENT_BALANCE') {
      req.flash('error', 'Insufficient balance.');
    } else {
      console.error(err);
      req.flash('error', 'Something went wrong.');
    }
    return res.redirect('/play/color');
  }
});

router.get('/play/myBets', ensureAuth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const bets = await prisma.bet.findMany({
      where: { userId },
      orderBy: { placedAt: 'desc' },
      include: {
        draw: { select: { drawCode: true } },
        gameType: { select: { code: true, name: true } },
      },
    });

    const rows = bets.map((bet) => ({
      id: bet.id,
      draw_id: bet.drawId,
      draw_code: bet.draw?.drawCode || null,
      game_type_id: bet.gameTypeId,
      game_code: bet.gameType?.code || null,
      game_name: bet.gameType?.name || null,
      chosen_number: bet.chosenNumber,
      chosen_color: bet.chosenColor,
      amount: Number(bet.amount),
      status: bet.status,
      payout: Number(bet.payout),
      placed_at: bet.placedAt,
    }));

    res.render('games/myBets', {
      title: 'My Bets',
      bets: rows,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not retrieve your bets.');
    res.redirect('/');
  }
});

router.get('/play/numberGame2', ensureAuth, async (req, res) => {
  const draw = await getOpenDrawByCode('NUMBER50');
  res.render('games/numberGame2', { title: 'Play Number 50 Game', draw });
});

router.post('/play/numberGame2', ensureAuth, async (req, res) => {
  const { draw_id, chosen_number, amount } = req.body;
  const userId = req.session.user.id;
  const config = GAME_CONFIG.NUMBER50;

  try {
    const drawId = toInt(draw_id);
    const chosenNumber = toInt(chosen_number);
    const betAmount = toInt(amount);

    if (!drawId || !chosenNumber) {
      req.flash('error', 'Draw and number are required.');
      return res.redirect('/play/numberGame2');
    }

    if (!betAmount || betAmount < config.minAmount || betAmount > config.maxAmount) {
      req.flash('error', `Amount must be between ${config.minAmount} and ${config.maxAmount}.`);
      return res.redirect('/play/numberGame2');
    }

    if (chosenNumber < config.minChoice || chosenNumber > config.maxChoice) {
      req.flash('error', `Choose a number between ${config.minChoice} and ${config.maxChoice}.`);
      return res.redirect('/play/numberGame2');
    }

    const payout = betAmount * config.multiplier;

    await prisma.$transaction(async (tx) => {
      const draw = await tx.draw.findFirst({
        where: { id: drawId, isClosed: false, gameType: { code: config.code } },
      });

      if (!draw) {
        throw new Error('DRAW_NOT_OPEN');
      }

      const [userTicketCount, drawTicketCount] = await Promise.all([
        tx.bet.count({ where: { userId, drawId } }),
        tx.bet.count({ where: { drawId } }),
      ]);

      if (userTicketCount >= config.perUserLimit) {
        throw new Error('USER_LIMIT_REACHED');
      }

      if (drawTicketCount >= config.drawLimit) {
        throw new Error('DRAW_SOLD_OUT');
      }

      const debitResult = await tx.user.updateMany({
        where: {
          id: userId,
          balance: { gte: betAmount },
        },
        data: {
          balance: { decrement: betAmount },
        },
      });

      if (debitResult.count !== 1) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      await tx.bet.create({
        data: {
          userId,
          drawId,
          amount: betAmount,
          chosenNumber,
          status: 'PENDING',
          payout,
          gameTypeId: draw.gameTypeId,
        },
      });
    });

    req.session.user.balance = Number(req.session.user.balance || 0) - betAmount;
    req.flash('success', `Bet placed! Win AED ${payout} per ticket.`);
    return res.redirect('/play/numberGame2');
  } catch (err) {
    if (err.message === 'DRAW_NOT_OPEN') {
      req.flash('error', 'This draw is closed or invalid.');
    } else if (err.message === 'USER_LIMIT_REACHED') {
      req.flash('error', 'You can buy max 5 tickets per draw.');
    } else if (err.message === 'DRAW_SOLD_OUT') {
      req.flash('error', 'All tickets sold for this draw.');
    } else if (err.message === 'INSUFFICIENT_BALANCE') {
      req.flash('error', 'Insufficient balance.');
    } else {
      console.error(err);
      req.flash('error', 'Something went wrong.');
    }
    return res.redirect('/play/numberGame2');
  }
});

router.get('/play/results', ensureAuth, async (req, res) => {
  try {
    const results = await prisma.draw.findMany({
      where: {
        isClosed: true,
        OR: [{ winningNumber: { not: null } }, { winningColor: { not: null } }],
      },
      include: { gameType: true },
      orderBy: { drawTime: 'desc' },
      take: 1000,
    });

    const rows = results.map((row) => ({
      id: row.id,
      game_type_id: row.gameTypeId,
      draw_time: row.drawTime,
      winning_number: row.winningNumber,
      winning_color: row.winningColor,
      code: row.gameType.code,
      name: row.gameType.name,
    }));

    res.render('games/results', {
      title: 'Results',
      results: rows,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not retrieve results.');
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        balance: true,
        createdAt: true,
      },
    });

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/');
    }

    res.render('games/myProfile', {
      title: 'My Profile',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.isAdmin,
        balance: Number(user.balance),
        created_at: user.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Unable to load profile');
    res.redirect('/');
  }
});

module.exports = router;
