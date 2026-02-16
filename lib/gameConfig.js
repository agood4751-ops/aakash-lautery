const GAME_CONFIG = {
  NUMBER: {
    code: 'NUMBER',
    multiplier: 70,
    minAmount: 1,
    maxAmount: 100,
    minChoice: 1,
    maxChoice: 100,
    perUserLimit: 5,
    drawLimit: 80,
    drawPrefix: 'SP-',
    drawStart: 1001,
  },
  NUMBER50: {
    code: 'NUMBER50',
    multiplier: 40,
    minAmount: 2,
    maxAmount: 200,
    minChoice: 1,
    maxChoice: 50,
    perUserLimit: 5,
    drawLimit: 40,
    drawPrefix: 'MD-',
    drawStart: 4001,
  },
  COLOR: {
    code: 'COLOR',
    multiplier: 2,
    minAmount: 1,
    maxAmount: 1000,
    perUserLimit: 5,
    drawLimit: 80,
    drawPrefix: 'CL-',
    drawStart: 7001,
  },
};

const ALLOWED_COLORS = ['RED', 'GREEN', 'BLUE', 'YELLOW'];

module.exports = {
  GAME_CONFIG,
  ALLOWED_COLORS,
};