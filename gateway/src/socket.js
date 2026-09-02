/**
 * Socket.io Real-Time Handler for CampusOptrix Gateway.
 * Manages WebSocket synchronization for What-If drag simulator and global schedule synchronization.
 */

const axios = require('axios');
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

function initSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Debounce timer per socket
    let moveTimeout = null;

    // Handle What-If drag move event
    socket.on('whatif:move', async (payload) => {
      if (moveTimeout) {
        clearTimeout(moveTimeout);
      }

      moveTimeout = setTimeout(async () => {
        try {
          // Call FastAPI /whatif
          const response = await axios.post(`${FASTAPI_URL}/whatif`, payload);
          
          // Broadcast recalculated state to all clients
          io.emit('whatif:update', {
            success: true,
            data: response.data,
            timestamp: Date.now()
          });
        } catch (err) {
          console.error('[Socket.io] What-If calculation error:', err.message);
          socket.emit('whatif:error', {
            message: 'Failed to recompute What-If scenario',
            error: err.response?.data || err.message
          });
        }
      }, 50); // 50ms debouncing window
    });

    // Handle Global Schedule / Allocation Update Broadcast
    socket.on('schedule:update', (payload) => {
      console.log('[Socket.io] Global schedule update broadcasted');
      io.emit('schedule:update', {
        ...payload,
        timestamp: Date.now()
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      if (moveTimeout) clearTimeout(moveTimeout);
    });
  });
}

module.exports = { initSocketHandlers };
