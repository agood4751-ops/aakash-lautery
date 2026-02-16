Setup steps:

1. npm install
2. Set your Neon URL in `.env` as `DATABASE_URL`
3. Run Prisma schema sync: `npm run prisma:push`
4. Seed game types: `npm run seed`
5. Start app: `npm run dev`

Notes:
- Database provider is now PostgreSQL (Neon compatible).
- Session storage is PostgreSQL (`connect-pg-simple`) using table `user_sessions`.