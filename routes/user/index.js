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
  app.get('/profile', [helpers.ensureAuthenticated, helpers.csrf], userCtrl.index);

  // Route for login
  app.get('/login', [helpers.ensureNotAuthenticated, helpers.csrf], userCtrl.login);
  app.post('/login', [helpers.ensureNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
  })]);

  // Route for the current user to see its account
  app.get('/dashboard', [helpers.ensureAuthenticated, helpers.csrf], userCtrl.updatePassword);
  app.get('/dashboard/update-password', [helpers.ensureAuthenticated, helpers.csrf], userCtrl.updatePassword);
  app.post('/dashboard/update-password', [helpers.ensureAuthenticated, userCtrl.checkUpdatePassword], userCtrl.updatePassword);
  // Route for the current user  to update its email
  app.get('/dashboard/update-email', [helpers.ensureAuthenticated, helpers.csrf], userCtrl.updateEmail);
  app.post('/dashboard/update-email', [helpers.ensureAuthenticated, userCtrl.checkUpdateEmail], userCtrl.updateEmail);

  // Route for a user to update their information
  app.post('/user/update', helpers.ensureAuthenticated, userCtrl.updateProfileAPI);
  app.post('/user/change-photo', helpers.ensureAuthenticated, userCtrl.uploadPhoto);
  app.post('/user/update-location', [helpers.ensureAuthenticated, userCtrl.checkForLngLat], userCtrl.updateLocation);

  // Route for getting users according to locations
  app.get('/user/search-location-api', helpers.ensureAuthenticated, userCtrl.searchLocationAPI);
  // Route for searching based on username
  app.get('/user/search-username-api', helpers.ensureAuthenticated, userCtrl.searchUsernameAPI);

  // Route for get recent conversations
  app.get('/user/recent-conversations', helpers.ensureAuthenticated, userCtrl.recentConversations);
  
  // Route for showing a user profile
  app.get('/user/:id', helpers.ensureAuthenticated, userCtrl.showProfile);

  // Route for go to the list user view
  app.get('/user', helpers.ensureAuthenticated, userCtrl.listUser);
  // Route for logout
  app.get('/logout', [helpers.ensureAuthenticated], userCtrl.logout);

};
