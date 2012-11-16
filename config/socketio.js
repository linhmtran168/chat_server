/*
 * Socketio configuration
 */
// Get the necessary variables
var RedisStore = require('socket.io/lib/stores/redis')
  , redis = require('redis')
  , _ = require('lodash')
  , User = require('../models/user')
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

    // Set the transports for socketio
    io.set('transports', [
      'websocket'
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
    ]);

    // Authorization for socketio
    io.set('authorization', function(handshakeData, callback) { 
      // Log
      console.log(handshakeData.query.accessToken);

      // Find the user with the accessToken in the mongo database
      User.findOne({ 'accessToken': handshakeData.query.accessToken }, function(err, user) {
        // If an error occures
        if (err) {
          return callback(err);
        }

        // If there is no user with this accessToken
        if (!user) {
          return callback('There is no user with this accessToken', false);
        }

        // Add the userId to the handshake data
        handshakeData.userId = user.id;
        // Process to connect to the socket
        callback(null, true);
      });
    });
  });

  // Configurate for development environment
  io.configure('development', function() {
    // Set the transport for socketio
    io.set('transports', ['websocket']);

    // Authorization for socketio
    io.set('authorization', function(handshakeData, callback) { 
      if (_.isUndefined(handshakeData.query.userId)) {
        console.log(handshakeData.query.accessToken);

        // Find the user with the accessToken in the mongo database
        User.findOne({ 'accessToken': handshakeData.query.accessToken }, function(err, user) {
          // If an error occures
          if (err) {
            return callback(err);
          }

          // If there is no user with this accessToken
          if (!user) {
            return callback('There is no user with this accessToken', false);
          }

          // Add the userId to the handshake data
          handshakeData.userId = user.id;
          // Process to connect to the socket
          callback(null, true);
        });
      } else {
        // For test
        handshakeData.userId = handshakeData.query.userId;
        callback(null, true);
      }
    });
  });
};
