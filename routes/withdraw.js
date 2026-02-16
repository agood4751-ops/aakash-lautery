const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { ensureAuth } = require('../middleware/auth');

router.use(express.json());
router.use(ensureAuth);

function toAmount(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

router.post('/request', async (req, res) => {
  try {
    const user = req.session.user;
    const amount = toAmount(req.body.amount);
    const walletAddress = String(req.body.wallet_address || '').trim();

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    await prisma.$transaction(async (tx) => {
      const debit = await tx.user.updateMany({
        where: {
          id: user.id,
          balance: { gte: amount },
        },
        data: {
          balance: { decrement: amount },
        },
      });

      if (debit.count !== 1) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      await tx.withdrawalRequest.create({
        data: {
          userId: user.id,
          amount,
          walletAddress,
          status: 'PENDING',
        },
      });

      await tx.cryptoTransaction.create({
        data: {
          userId: user.id,
          address: walletAddress,
          amount,
          type: 'WITHDRAWAL',
          status: 'PENDING',
        },
      });
    });

    req.session.user.balance = Number(req.session.user.balance || 0) - amount;
    return res.json({ success: true, message: 'Withdrawal requested' });
  } catch (err) {
    if (err.message === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    console.error('Withdraw error:', err);
    return res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

module.exports = router;