var _ = require('lodash')
  , fs = require('fs');

/*
 * Helpers for user route
 */
// Middleware to ensure an user is authenticated
exports.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
  return next();
  }

  res.redirect('/login');
};

// Middleware to ensure an user is not authenticated
exports.ensureNotAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  next();
};

// Middleware to create a csrf token to use with the request
exports.csrf = function(req, res, next) {
  // Set the local token variable
  res.locals.token = req.session._csrf;

  next();
};

// Middle ware to delete the profile photo
exports.deletePhoto = function(profilePhoto) {
  var defaultPhotos = ['male_avatar.png', 'female_avatar.png', 'default_avatar.png'];
  // If profile photo of this user is a default one do nothing
  if (_.indexOf(defaultPhotos, profilePhoto) !== -1) {
    return;
  }

  var photoPath;
  // Create the photo path according to environment
  if (process.env.NODE_ENV === 'production') {
    photoPath = '/home/linhtm/sites/ogorinImage/';
  } else {
    photoPath = './public/images/';
  }
  // Delete the photo
  fs.unlink(photoPath + profilePhoto, function(err) {
    if (err) {
      console.log(err);
      return;
    }

    console.log('Successfully delete the profile Photo');
  });
};
