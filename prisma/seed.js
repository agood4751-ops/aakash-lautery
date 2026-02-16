const prisma = require('../config/prisma');

async function main() {
  const gameTypes = [
    { code: 'NUMBER', name: 'Sprint 70x' },
    { code: 'COLOR', name: 'Color Lottery' },
    { code: 'NUMBER50', name: 'Mid-Day 40x' },
  ];

  for (const gameType of gameTypes) {
    await prisma.gameType.upsert({
      where: { code: gameType.code },
      update: { name: gameType.name },
      create: gameType,
    });
  }

  console.log('Seed completed: game_types synced.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });