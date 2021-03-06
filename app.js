
/**
 * Module dependencies.
 */

var express = require('express')
  , mongoose = require('mongoose')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , RedisStore = require('connect-redis')(express)
  , passport = require('passport')
  , flash = require('connect-flash')
  , validator = require('express-validator')
  , socketIO = require('socket.io');

// Create the express and http server instance
var app = express()
  , secret = 'DragonLinh123456789'
  , cookieParser = express.cookieParser(secret)
  , redisStore = new RedisStore({ db: 'userSessions', maxAge: 1440000 });

app.configure(function(){
  app.set('port', process.env.PORT || 3100);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  // Static asset
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.favicon());

  // Logger
  app.use(express.logger('dev'));
  app.use(express.bodyParser({
    keepExtensions: true
  }));
  app.use(validator);
  app.use(express.methodOverride());

  // Session configuration
  app.use(express.cookieParser());
  app.use(express.session({
    store: redisStore,
    secret: secret
  }));

  // Set up passport
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());

  // Set up CSRF
  app.use(express.csrf());

  // Authentication configuration
  app.use(function(req, res, next) {
    // Set the local user = req.user
    res.locals.currentUser = req.user;
    // Set the page title
    res.locals.slug = '';

    next();
  });

  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  mongoose.connect('mongodb://localhost:27017/ogorin', { user: 'ogorin', pass: 'dragonLinh123' });
});

app.configure('production', function(){
  app.use(express.errorHandler());
  // Configure winston
  var winston = require('winston');
  winston.add(winston.transports.File, { filename: './logs/ogorin_chat_access.log' });
  winston.handleExceptions(new winston.transports.File({ filename: './logs/ogorin_chat_err.log' }));

  // Mongoose connect;
  mongoose.connect('mongodb://localhost:27017/ogorin', { user: 'ogorinPro', pass: 'ProOgorinMongo' });
});

// Create the server instance
var server = http.createServer(app);

// Create the socketIO instance
io = require('socket.io').listen(server);

// Configure socketio
require('./config/socketio')(io, redisStore, cookieParser);

// Require passport configuration
require('./config/passport');

// Main route 
routes(app, io);

// HTTP server listen
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

