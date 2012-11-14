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
     * @param <Object> data { receiverId: '', timestamp: '', message: '' }
     */
    socket.on('message', function(data) {
      console.log('Data send from client' + data);
      //---- Send message to the receiver if he/she is online
      Chat.checkReceiverStatus(data.receiverId, function(err, receiverSockId) {
        // If there is a error
        if (err) {
          socket.emit('error', { message: 'There is error getting socketId from database' });
          throw err;
        }

        // Else
        if (!receiverSockId) {
          console.log('User is offline');
          // Emit notify offline event to the client that send the message

          socket.emit('notify-offline', { message: 'The user you want to send message is offline, he/she will receive your message when he/she is online again'  });
        } else {
          console.log('Successfully getting socket id: ' + receiverSockId + ' of user id: ' + data.receiverId);

          // Create the message object
          var messageObj = {
            senderId: socket.handshake.userId,
            timestamp: data.timestamp,
            message: data.message
          };

          // Send the message to the receiver
          io.sockets.socket(receiverSockId).emit('message-arrived', messageObj);
        }
        
      });

      //---- Save new conversation to the database
      Chat.updateConvesationList(socket.handshake.userId, data.receiverId, data.message, data.timestamp, function(err, response) {
        // If there is a error
        if (err) {
          socket.emit('error', { message: 'There is error saving message to database' });
          throw err;
        }

        // Else
        console.log('Reponse success: ' + response);
      });

      //---- Save new message to database
      Chat.addMessageToConversation(socket.handshake.userId, data.receiverId, data.message, data.timestamp, function(err, response) {
        // If there is a error
        if (err) {
          socket.emit('error', { message: 'There is error saving message to database' });
          throw err;
        }

        // Else
        console.log('Reponse success: ' + response);
      });

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
