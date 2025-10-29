const { PrismaClient } = require('../generated/prisma-client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});


prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 Query: ${e.query}`);
    console.log(`⏱️  Duration: ${e.duration}ms`);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;

