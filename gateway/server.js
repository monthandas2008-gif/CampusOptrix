/**
 * CampusOptrix API Gateway Server.
 * Express HTTP server + Socket.io WebSocket server on port 4000.
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const apiRoutes = require('./src/routes');
const { initSocketHandlers } = require('./src/socket');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

// Middleware
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  }
});

initSocketHandlers(io);

// Start Server
server.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`📐 CAMPUSOPTRIX API GATEWAY RUNNING ON PORT ${PORT}`);
  console.log(`• REST Proxy ➔ /api/* ➔ http://localhost:8000`);
  console.log(`• WebSocket ➔ ws://localhost:${PORT}`);
  console.log(`=============================================`);
});
