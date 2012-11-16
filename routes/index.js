
/*
 * Main entry for setting all the app route & function
 */

module.exports = function(app, io) {
  require('./chat')(io);
  require('./test')(app);
};
