const axios = require('axios');

const USDT_CONTRACT = process.env.USDT_CONTRACT;
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;

async function checkDeposit(address, expectedAmount) {
  try {
    if (!USDT_CONTRACT || !BSCSCAN_API_KEY) {
      throw new Error('Missing USDT_CONTRACT or BSCSCAN_API_KEY');
    }

    const url = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${USDT_CONTRACT}&address=${address}&apikey=${BSCSCAN_API_KEY}`;
    const response = await axios.get(url);

    const rawBalance = Number(response?.data?.result || 0);
    const balance = rawBalance / 1e6;
    const expected = Number(expectedAmount);

    if (Number.isFinite(balance) && Number.isFinite(expected) && balance + 1e-9 >= expected) {
      return 'confirmed';
    }

    return `pending:${balance}`;
  } catch (err) {
    console.error('Monitor error:', err.message || err);
    return 'error checking deposit';
  }
}

module.exports = { checkDeposit };