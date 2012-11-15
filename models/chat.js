/*
 * Model for chat
 */
// Get the redis client
var redis = require('redis')
  , redisClient = redis.createClient();

/*
 * Main module
 */
module.exports = {

  /**
   * Function to save sockId to redis
   * @param <String> userId
   * @param <String> sockId
   * @return void
   */
  saveUserSockId: function(userId, sockId) {
    redisClient.set('chat:' + userId + ':sockId', sockId, redis.print);
  },

  /**
   * Check if receiverId is online or not (in socketlist)
   * @param <String> receiverId
   */
  checkReceiverStatus: function(receiverId, callback) {
    redisClient.get('chat:' + receiverId + ':sockId', function(err, response) {
      // If err
      if (err) {
        return callback(err, false);
      }

      // If this key not set
      if (!response) {
        return callback(null, null);
      }

      return callback(null, response);
    });
  },


  /**
   * Function to remove user's sockID from database
   * @param <String> userId
   * @return void
   */
  removeUserSockId: function(userId) {
    redisClient.del('chat:' + userId + ':sockId', redis.print);
  },

  /**
   * Function to add a message to message list
   * @param <String> senderId
   * @param <String> receiverId
   * @param <String> message
   * @param <String> timestamp
   * @param <Function> callback
   * @return void
   */
  addMessageToConversation: function(senderId, receiverId, message, timestamp, callback) {
    // Create the message object
    var messageObj = {
      message: message,
      timestamp: timestamp,
      senderId: senderId,
    };

    // Save the new message obj to list of the messages of 2 user
    // Sender
    redisClient.lpush('chat:' + senderId + ':' + receiverId + ':messages', JSON.stringify(messageObj), function(err, response) {
      // If error
      if (err) {
        return callback(err, false);
      }

      // Return the response
      return callback(null, response);
    });

    // Receiver
    redisClient.lpush('chat:' + receiverId + ':' + senderId + ':messages', JSON.stringify(messageObj), function(err, response) {
      // If error
      if (err) {
        return callback(err, false);
      }

      // Return the response
      return callback(null, response);
    });
  },

  /**
   * Function to create a new conversation
   * @param <String> userId
   * @param <String> senderId
   * @param <String> timestamp
   * @param <String> message
   * @param <Function> callback
   * @return void
   */
  updateConversationList: function(senderId, receiverId, message, timestamp, callback) {
    // Create arguments array for 2 list sender and receiver
    var argsSender = ['chat:' + senderId + ':conversations', parseInt(timestamp, 10), receiverId];
    var argsReceiver = ['chat:' + receiverId + ':conversations', parseInt(timestamp, 10), senderId];

    // Create the message object
    var messageObj = {
      message: message,
      timestamp: timestamp,
      senderId: senderId,
    };

    // Add/update the new conversation to the list of sender conversations
    redisClient.zadd(argsSender, function(err, response) {
      if (err) {
        return callback(err, false);
      }

      // Set the last message
      redisClient.set('chat:' + senderId + ':' + receiverId + ':lastMessage', JSON.stringify(messageObj), redis.print);

      return callback(null, response);
    });

    // Add/update the new conversation to the list of receiver conversations
    redisClient.zadd(argsReceiver, function(err, response) {
      if (err) {
        return callback(err, false);
      }

      // Set the last message
      redisClient.set('chat:' + receiverId + ':' + senderId + ':lastMessage', JSON.stringify(messageObj), redis.print);

      return callback(null, response);
    });
  }
};
