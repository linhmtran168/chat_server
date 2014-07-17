/*
 * Module for chat
 */
var redis = require('redis')
  , _ = require('lodash')
  , Chat = require('../../models/chat')
  , userCtrl = require('../user/user');

module.exports = function(io) {
  // Variable to hold the number of messages received
  var numMessageSent = 0
    , numMessageReceived = 0;
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
      // Log
      console.log('Message - Data send from client:');
      console.dir(data);

      // Increase number of messages sent
      numMessageSent += 1;

      // Create the current timestamp variable
      var currentTimestamp = Math.round(+new Date()/1000);

      //---- Send message to the receiver if he/she is online
      Chat.checkReceiverStatus(data.receiverId, function(err, receiverSockIds) {
        // If there is a error
        if (err) {
          socket.emit('error', { message: 'There is error getting socketId from database' });
          throw err;
        }

        // Else
        if (!receiverSockIds) {
          console.log('User is not connected to socket service');

          // Check if user online or not
          userCtrl.checkUserStatus(data.receiverId, function(isOnline, err) {
            // If there is error
            if (err) {
              console.log('There is error checking user status');
              return;
            }

            if (isOnline) {
              console.log('User is online');
              return;
            }

          console.log('User is offline');
          // Emit notify offline event to the client that send the message
          socket.emit('notify-offline', { message: 'このユーザーはオフラインしています。彼・彼女は再びオンラインになればあなたのメッセージを読むことができます。'  });
          });
        } else {
          console.log('Successfully getting socket id for user Id ' + data.receiverId);

          // Create the message object
          var messageObj = {
            senderId: socket.handshake.userId,
            deviceTimestamp: data.timestamp,
            timestamp: currentTimestamp,
            message: data.message
          };

          // Send the message to the all the receiver
          _.forEach(receiverSockIds, function(sockId){
            io.sockets.socket(sockId).emit('message-arrived', messageObj);
          });
        }
        
      });

      //---- Save new conversation to the database
      Chat.updateConversationList(socket.handshake.userId, data.receiverId, data.message, data.timestamp, currentTimestamp, function(err, response) {
        // If there is a error
        if (err) {
          socket.emit('error', { message: 'There is error saving message to database' });
          throw err;
        }

        // Else
        console.log('Reponse success: ' + response);
      });

      //---- Save new message to database
      Chat.addMessageToConversation(socket.handshake.userId, data.receiverId, data.message, data.timestamp, currentTimestamp, function(err, response) {
        // If there is a error
        if (err) {
          socket.emit('error', { message: 'There is error saving message to database' });
          throw err;
        }

        // Else
        console.log('Reponse success: ' + response);
      });

    });

    /**
     * Function to handle when client notify that it received a new messsage
     * @param <Object> data { receiverId: '', timestamp: '', message: '' }
    */
    socket.on('message-received', function() {
      // Increase the number of message received
      numMessageReceived += 1;
      console.log('Message-received: +1');
    });


    // When socket disconnect
    socket.on('disconnect', function() {
      // Log
      console.log('Disconnect: ' + socket.id + ' to delete: ' + socket.handshake.userId);
      // When disconnect remove the socketId from the database
      Chat.removeUserSockId(socket.handshake.userId, socket.id);

      // Calculate points for this user
      userCtrl.updatePoints(numMessageSent, numMessageReceived, socket.handshake.userId, function(err, username, points) {
        // Error case
        if (err) {
          console.log(err);
          return;
        }
        // Log the result
        console.log('Calculate Points - ' + username + '\'s points: ' + points);
      });
    });
  });
};
