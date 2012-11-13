/*
 * Module for chat
 */
var redis = require('redis')
  , Chat = require('../../models/chat');

module.exports = function(io) {
  // Socket io handling
  io.sockets.on('connection', function(socket) {

    // Log
    console.log('New user with socketId: ' + socket.id + ':' + socket.handshake.userId);
    // Save sockedId to the database
    Chat.saveUserSocketId(socket.handshake.userId, socket.id);

    // When there is a new message
    socket.on('message', function(data) {

    });

    // When socket disconnect
    socket.on('disconnect', function() {
      // Log
      console.log('Disconnect, to delete: ' + socket.handshake.userId);
      Chat.removeUserSocketId(socket.handshade.userId);
    });
  });
};
