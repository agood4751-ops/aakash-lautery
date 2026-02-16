const express = require('express');
const prisma = require('../config/prisma');
const { ensureAdmin } = require('../middleware/auth');
const { GAME_CONFIG, ALLOWED_COLORS } = require('../lib/gameConfig');

const router = express.Router();

function toInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

router.get('/', ensureAdmin, async (req, res) => {
  const [userCount, betCount] = await Promise.all([prisma.user.count(), prisma.bet.count()]);
  res.render('admin/dashboard', { title: 'Admin Dashboard', userCount, betCount });
});

router.get('/draws', ensureAdmin, async (req, res) => {
  const page = Math.max(toInt(req.query.page) || 1, 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const [total, draws] = await Promise.all([
    prisma.draw.count(),
    prisma.draw.findMany({
      include: { gameType: true },
      orderBy: { drawTime: 'desc' },
      skip: offset,
      take: limit,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const rows = draws.map((d) => ({
    id: d.id,
    draw_code: d.drawCode,
    game_type_id: d.gameTypeId,
    draw_time: d.drawTime,
    winning_number: d.winningNumber,
    winning_color: d.winningColor,
    is_closed: d.isClosed,
    game_name: d.gameType.name,
    code: d.gameType.code,
  }));

  res.render('admin/draws', {
    title: 'Manage Draws',
    draws: rows,
    currentPage: page,
    totalPages,
  });
});

router.post('/draws', ensureAdmin, async (req, res) => {
  const { game_type_code, draw_time } = req.body;

  try {
    const gameConfig = GAME_CONFIG[game_type_code];
    if (!gameConfig) {
      req.flash('error', 'Unsupported game type.');
      return res.redirect('/admin/draws');
    }

    const drawTime = new Date(draw_time);
    if (Number.isNaN(drawTime.getTime())) {
      req.flash('error', 'Invalid draw time.');
      return res.redirect('/admin/draws');
    }

    const gameType = await prisma.gameType.findUnique({
      where: { code: game_type_code },
      select: { id: true },
    });

    if (!gameType) {
      req.flash('error', 'Invalid game type.');
      return res.redirect('/admin/draws');
    }

    const drawCode = await prisma.$transaction(async (tx) => {
      const lastDraw = await tx.draw.findFirst({
        where: {
          gameTypeId: gameType.id,
          drawCode: { startsWith: gameConfig.drawPrefix },
        },
        orderBy: { id: 'desc' },
        select: { drawCode: true },
      });

      let nextNumber = gameConfig.drawStart;
      if (lastDraw?.drawCode) {
        const lastNumber = Number.parseInt(lastDraw.drawCode.replace(gameConfig.drawPrefix, ''), 10);
        if (Number.isInteger(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }

      const nextDrawCode = `${gameConfig.drawPrefix}${nextNumber}`;

      await tx.draw.create({
        data: {
          gameTypeId: gameType.id,
          drawTime,
          drawCode: nextDrawCode,
        },
      });

      return nextDrawCode;
    });

    req.flash('success', `Draw created (${drawCode}).`);
    return res.redirect('/admin/draws');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error creating draw.');
    return res.redirect('/admin/draws');
  }
});

router.post('/draws/:id/close', ensureAdmin, async (req, res) => {
  const drawId = toInt(req.params.id);
  const winningNumberInput = toInt(req.body.winning_number);
  const winningColorInput = String(req.body.winning_color || '').toUpperCase();

  if (!drawId) {
    req.flash('error', 'Invalid draw id.');
    return res.redirect('/admin/draws');
  }

  try {
    await prisma.$transaction(async (tx) => {
      const draw = await tx.draw.findUnique({
        where: { id: drawId },
        include: { gameType: true },
      });

      if (!draw) {
        throw new Error('DRAW_NOT_FOUND');
      }

      if (draw.isClosed) {
        throw new Error('DRAW_ALREADY_CLOSED');
      }

      const gameCode = draw.gameType.code;
      const gameConfig = GAME_CONFIG[gameCode];
      if (!gameConfig) {
        throw new Error('UNSUPPORTED_GAME');
      }

      let winningNumber = null;
      let winningColor = null;

      if (gameCode === 'NUMBER' || gameCode === 'NUMBER50') {
        if (!winningNumberInput) {
          throw new Error('INVALID_WINNING_NUMBER');
        }

        if (winningNumberInput < gameConfig.minChoice || winningNumberInput > gameConfig.maxChoice) {
          throw new Error('INVALID_WINNING_NUMBER');
        }

        winningNumber = winningNumberInput;
      }

      if (gameCode === 'COLOR') {
        if (!ALLOWED_COLORS.includes(winningColorInput)) {
          throw new Error('INVALID_WINNING_COLOR');
        }
        winningColor = winningColorInput;
      }

      await tx.draw.update({
        where: { id: drawId },
        data: {
          winningNumber,
          winningColor,
          isClosed: true,
        },
      });

      const bets = await tx.bet.findMany({ where: { drawId } });

      for (const bet of bets) {
        let status = 'LOST';
        let payout = 0;

        if (gameCode === 'NUMBER' || gameCode === 'NUMBER50') {
          if (bet.chosenNumber !== null && bet.chosenNumber === winningNumber) {
            status = 'WON';
            payout = Number(bet.amount) * gameConfig.multiplier;
          }
        } else if (gameCode === 'COLOR') {
          if (bet.chosenColor && bet.chosenColor === winningColor) {
            status = 'WON';
            payout = Number(bet.amount) * gameConfig.multiplier;
          }
        }

        await tx.bet.update({
          where: { id: bet.id },
          data: {
            status,
            payout,
          },
        });

        if (status === 'WON' && payout > 0) {
          await tx.user.update({
            where: { id: bet.userId },
            data: { balance: { increment: payout } },
          });
        }
      }
    });

    req.flash('success', 'Result declared and winners updated!');
    return res.redirect('/admin/draws');
  } catch (err) {
    if (err.message === 'DRAW_NOT_FOUND') {
      req.flash('error', 'Draw not found.');
    } else if (err.message === 'DRAW_ALREADY_CLOSED') {
      req.flash('error', 'Draw is already closed.');
    } else if (err.message === 'INVALID_WINNING_NUMBER') {
      req.flash('error', 'Invalid winning number for this game.');
    } else if (err.message === 'INVALID_WINNING_COLOR') {
      req.flash('error', 'Invalid winning color for this game.');
    } else {
      console.error(err);
      req.flash('error', 'Error closing draw.');
    }
    return res.redirect('/admin/draws');
  }
});

router.get('/bets/:drawId', ensureAdmin, async (req, res) => {
  const drawId = toInt(req.params.drawId);

  if (!drawId) {
    req.flash('error', 'Invalid draw id.');
    return res.redirect('/admin/draws');
  }

  try {
    const bets = await prisma.bet.findMany({
      where: { drawId },
      include: {
        user: { select: { name: true } },
        draw: { select: { drawCode: true } },
      },
      orderBy: { placedAt: 'desc' },
    });

    const rows = bets.map((bet) => ({
      id: bet.id,
      user_id: bet.userId,
      username: bet.user?.name || 'Unknown',
      draw_id: bet.drawId,
      draw_code: bet.draw?.drawCode || null,
      amount: Number(bet.amount),
      chosen_number: bet.chosenNumber,
      chosen_color: bet.chosenColor,
      status: bet.status,
      payout: Number(bet.payout),
      placed_at: bet.placedAt,
    }));

    res.render('admin/bets', { title: 'View Bets', bets: rows });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error fetching bets.');
    res.redirect('/admin/draws');
  }
});

module.exports = router;