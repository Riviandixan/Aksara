require('dotenv').config();
const http                    = require('http');
const { Server }              = require('socket.io');
const app                     = require('./app');
const { testConnection }      = require('./config/db');
const registerBattleSocket    = require('./socket/battle.socket');

const PORT   = process.env.PORT || 5000;
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

registerBattleSocket(io);

async function start() {
  await testConnection();
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
