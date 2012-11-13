/*
 * Socketio configuration
 */
// Get the necessary variables
var RedisStore = require('socket.io/lib/stores/redis')
  , redis = require('redis')
  , User = require('../../ogorinAdmin/models/user')
  , pub = redis.createClient()
  , sub = redis.createClient()
  , client = redis.createClient();

module.exports = function(io) {
  // Set up socketio to use redis as storage
  io.set('store', new RedisStore({
    redisPub: pub,
    redisSub: sub,
    redisClient: client
  }));

  // Configure for production environment
  io.configure('production', function() {
    io.enable('browser client etag');
    io.enable('browser client minification');  // send minified client
    io.enable('browser client gzip');          // gzip the file
    io.set('log level', 1);                    // reduce logging

    io.set('transports', [
      'websocket'
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
    ]);

    // Authorization for socketio
    io.set('authorization', function(handshakeData, callback) { 

    });
  });

  // Configurate for development environment
  io.configure('development', function() {
    io.set('transports', ['websocket']);
  });
};
