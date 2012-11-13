/*
 * Module for chat
 */
var redis = require('redis')
  , Chat = require('../../models/chat');

module.exports = function(io) {
  /**
   * Socket io handling
   */
  io.sockets.on('connection', function(socket) {

    // Log
    console.log('New user with socketId: ' + socket.id + ' : ' + socket.handshake.userId);
    // When there is a new connection, save newsockedId to the database
    Chat.saveUserSockId(socket.handshake.userId, socket.id);

    // Emit welcome event to the client
    socket.emit('welcome', { message: 'You have connected to socket service' });
    /**
     * Function to handle when there is a new message
     * @param <Object> data { senderId: '', timestamp: '', message: '' }
     */
    socket.on('message', function(data) {
      console.log(data);
    });

    // When socket disconnect
    socket.on('disconnect', function() {
      // Log
      console.log('Disconnect, to delete: ' + socket.handshake.userId);
      // When disconnect remove the socketId from the database
      Chat.removeUserSockId(socket.handshake.userId);
    });
  });
};
