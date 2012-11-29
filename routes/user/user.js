var User = require('../../models/user')
  , moment = require('moment')
  , _ = require('lodash')
  , helpers = require('./helpers');

moment.lang('jp');

/*
 * Route for user
 */
module.exports = {
  /*
   * Function for render the main profile's user page
   */
  index: function(req, res) {

    res.render('user/profile', {
      title: 'Your profile',
      user: req.currentUser,
      slug: 'profile'
    });
  },
  /*
   * Function for a user to login
   */
  login: function(req, res) {
    var message = req.flash('error');
    res.render('user/login', {
      title: 'Part-timer Login',
      message: message,
    });
  },

  /*
   * Function for a user to logout
   */
  logout: function(req, res) {
    req.logout();
    res.redirect('/');
  }
};
