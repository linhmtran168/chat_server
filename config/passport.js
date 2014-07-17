var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , User = require('../models/user');


// Define authentication strategy
passport.use(new LocalStrategy({
    usernameField: 'username',
  },
  function(username, password, done) {
    console.log(username + ':' + password);
    User.authenticate(username, password, function(err, user, message) {
      done(err, user, message);
    });
  }
));


// Serialize user on login
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// Deserialize user on log out
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

module.export = {};
