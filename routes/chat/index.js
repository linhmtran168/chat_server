/*
 * Module for chat
 */
var redis = require('redis');

module.exports = function(io) {
  // Socket io handling
  io.sockets.on('connection', function(socket) {

    // Initial setup for this new socket
    // 

    // When there is a new message
    socket.on('message', function(data) {

    });

    // When socket disconnect
    socket.on('disconnect', function() {
      // Todo
    });
  });
};
