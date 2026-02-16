const { Web3 } = require('web3');
const QRCode = require('qrcode');

const web3 = new Web3();

async function generateWalletPlain() {

  const account = web3.eth.accounts.create();

  const address = account.address;
  const privateKey = account.privateKey;

  const qr = await QRCode.toDataURL(address);

  return { address, privateKey, qr };

}

module.exports = { generateWalletPlain };
