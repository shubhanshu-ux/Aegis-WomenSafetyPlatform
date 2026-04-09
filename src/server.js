require('dotenv').config();
const http = require('http');
const { createApp } = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./socket/socketServer');

const PORT = Number(process.env.PORT) || 4000;

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Copy .env.example to .env and set JWT_SECRET.');
  process.exit(1);
}

async function main() {
  await connectDB();
  console.log('MongoDB connected');

  const app = createApp();
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
