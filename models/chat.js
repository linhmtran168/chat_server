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
   * @param <String> userId, <String> sockId
   * @return void
   */
  saveUserSockId: function(userId, sockId) {
    redisClient.set('chat:' + userId + ':sockId', sockId, redis.print);
  },

  /**
   * Function to remove user's sockID from database
   * @param <String> userId
   * @return void
   */
  removeUserSockId: function(userId) {
    redisClient.del('chat:' + userId + ':sockId', redis.print);
  }
};
