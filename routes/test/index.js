/*
 * Module for testing chat service
 */
module.exports = function(app) {

  // Route for test chat
  app.get('/test', function(req, res) {
    return res.render('index', {
      title: 'Test Chat'
    });
  });
};
