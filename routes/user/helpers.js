/*
 * Helpers for user route
 */
// Middleware to ensure an user is authenticated
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
