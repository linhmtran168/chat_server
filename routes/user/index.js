/*
 * Route for user part of the site
 */
var passport = require('passport')
  , helpers = require('./helpers');

module.exports = function(app) {

  // Load controllers
  var userCtrl = require('./user');

  // Homepage route
  app.get('/', [helpers.ensureAuthenticated, helpers.csrf], userCtrl.index);

  // Route for login
  app.get('/login', [helpers.ensureNotAuthenticated, helpers.csrf], userCtrl.login);
  app.post('/login', [helpers.ensureNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
  })]);

  // Route for a user to update their information
  app.post('/user/update', helpers.ensureAuthenticated, userCtrl.updateProfileAPI);
  app.post('/user/change-photo', helpers.ensureAuthenticated, userCtrl.uploadPhoto);
  app.post('/user/update-location', [helpers.ensureAuthenticated, userCtrl.checkForLngLat], userCtrl.updateLocation);

  // Route for getting users according to locations
  app.get('/user/search-location-api', helpers.ensureAuthenticated, userCtrl.searchLocationAPI);
  // Route for logout
  app.get('/logout', [helpers.ensureAuthenticated], userCtrl.logout);
};
