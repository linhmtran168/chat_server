
/**
 * Module dependencies.
 */

var express = require('express')
  , mongoose = require('mongoose')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , socketIO = require('socket.io');

// Configure winston
var winston = require('winston');
winston.add(winston.transports.File, { filename: './logs/ogorin_chat_access.log' });
winston.handleExceptions(new winston.transports.File({ filename: './logs/ogorin_chat_err.log' }));

// Create the express and http server instance
var app = express()
  , server = http.createServer(app);

app.configure(function(){
  app.set('port', process.env.PORT || 3100);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('DragonLinh123456'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  mongoose.connect('mongodb://localhost:27017/ogorin', { user: 'ogorin', pass: 'dragonLinh123' });
});

app.configure('production', function(){
  app.use(express.errorHandler());
  mongoose.connect('mongodb://localhost:27017/ogorin', { user: 'ogorinPro', pass: 'ProOgorinMongo' });
});

// app.get('/', routes.index);
// app.get('/users', user.list);

// Create the socketIO instance
io = require('socket.io').listen(server);

// Configure socketio
require('./config/socketio')(io);

// HTTP server listen
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// Main route 
routes(app, io);
