/*
 * Route for user part of the site
 */
var passport = require('passport')
  , helpers = require('./helpers');

module.exports = function(app) {

  // Load controllers
  var userCtrl = require('./user');

  // Homepage route
  app.get('/', helpers.ensureAuthenticated, userCtrl.index);

  // Route for login
  app.get('/login', [helpers.ensureNotAuthenticated], userCtrl.login);
  app.post('/login', [helpers.ensureNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
  })]);

  // Route for logout
  app.get('/logout', [helpers.ensureAuthenticated], userCtrl.logout);
};
