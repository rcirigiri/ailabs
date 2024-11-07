const {LOG_LEVELS} = require('../utils/constants');
const {Server} = require('socket.io');

/**
 * Initialize Socket.IO
 *
 * @param {object} server - HTTP server to attach the socket to
 * @returns {object} Socket.IO instance
 * @public
 */
exports.initSocket = server => {
  const io = socketIO(server);

  // Log connection events
  io.on('connection', socket => {
    console.log('New client connected', LOG_LEVELS.INFO);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected', LOG_LEVELS.INFO);
    });

    // Add any additional event handlers here
  });

  console.log('Socket.IO initialized', LOG_LEVELS.INFO);
  return io;
};
