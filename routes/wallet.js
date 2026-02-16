const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { ensureAuth } = require('../middleware/auth');

const { generateWalletPlain } = require('../services/walletService');
const { checkDeposit } = require('../services/monitor');

router.use(express.json());
router.use(ensureAuth);

function toAmount(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

router.post('/generate', async (req, res) => {
  try {
    const user = req.session.user;
    const amount = toAmount(req.body.amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const wallet = await generateWalletPlain();

    await prisma.cryptoAddress.create({
      data: {
        userId: user.id,
        walletAddress: wallet.address,
        amount,
        privateKeyPlain: wallet.privateKey,
      },
    });

    return res.json({
      address: wallet.address,
      qr: wallet.qr,
    });
  } catch (err) {
    console.error('Wallet generate error:', err);
    return res.status(500).json({ error: 'Failed to generate wallet' });
  }
});

router.post('/check', async (req, res) => {
  try {
    const user = req.session.user;
    const address = String(req.body.address || '').trim();

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const depositRecord = await prisma.cryptoAddress.findFirst({
      where: {
        userId: user.id,
        walletAddress: address,
      },
    });

    if (!depositRecord) {
      return res.status(404).json({ error: 'Deposit address not found' });
    }

    if (depositRecord.isUsed) {
      return res.json({ status: 'confirmed' });
    }

    const expectedAmount = Number(depositRecord.amount);
    const status = await checkDeposit(address, expectedAmount);

    if (status !== 'confirmed') {
      return res.json({ status });
    }

    let creditedAmount = 0;

    await prisma.$transaction(async (tx) => {
      const lockResult = await tx.cryptoAddress.updateMany({
        where: {
          id: depositRecord.id,
          isUsed: false,
        },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });

      if (lockResult.count !== 1) {
        throw new Error('ALREADY_CREDITED');
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { increment: expectedAmount },
        },
      });

      await tx.cryptoTransaction.create({
        data: {
          userId: user.id,
          address,
          amount: expectedAmount,
          type: 'DEPOSIT',
          status: 'CONFIRMED',
        },
      });

      creditedAmount = expectedAmount;
    });

    req.session.user.balance = Number(req.session.user.balance || 0) + creditedAmount;
    return res.json({ status: 'confirmed' });
  } catch (err) {
    if (err.message === 'ALREADY_CREDITED') {
      return res.json({ status: 'confirmed' });
    }

    console.error('Deposit check error:', err);
    return res.status(500).json({ status: 'error checking deposit' });
  }
});

module.exports = router;