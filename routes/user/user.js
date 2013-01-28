var User = require('../../models/user')
  , moment = require('moment')
  , redis = require('redis')
  , redisClient = redis.createClient()
  , _ = require('lodash')
  , helpers = require('./helpers')
  , crypto = require('crypto')
  , util = require('util')
  , bcrypt = require('bcrypt')
  , im = require('imagemagick');

moment.lang('jp');

/*
 * Route for user
 */
module.exports = {
  /*
   * Function for render the main profile's user page
   */
  index: function(req, res) {
    // If current user status is offline, change the status
    if (req.user.status === "offline") {
      // Find the id of the current user in the database and update
      User.findByIdAndUpdate(req.user.id, { $set: { status: 'online' } }, function(err, user) {
        if (err) {
          console.log(err);
          return;
        }

        console.log('After Login: Successfully change the status of user');
        return;
      });
    }

    // Update case the gender
    if (!_.isUndefined(req.user.gender) && !_.isEmpty(req.user.gender)) {
      req.user.gender = req.user.gender.charAt(0).toUpperCase() + req.user.gender.slice(1);
    }

    // Change format of the birthday of user
    if (!_.isUndefined(req.user.birthday) && !_.isEmpty(req.user.birthday)) {
      req.user.birthday = moment.unix(parseInt(req.user.birthday, 10)).format('DD/MM/YYYY');
    }

    // Get the error message 
    var message = req.flash('message');
  
    // Render the profile page for user
    res.render('user/account', {
      title: 'マイプロフィール',
      user: req.user,
      slug: 'profile',
      message: message
    });
  },
  /*
   * Function for a user to login
   */
  login: function(req, res) {
    var message = req.flash('error');
    res.render('user/login', {
      title: 'ログイン',
      message: message,
    });
  },

  /*
   * Function to update current user profile
   */
  updateProfileAPI: function(req, res) {
    console.log(req.body);

    // If there is no name in value in the body of request send error
    if (!req.body.name || !req.body.value) {
      return res.json(400, {
        status: 0,
        error: {
          type: 'system',
          message: 'Wrong type of request'
        }
      });
    }

    // Find the current user id instance
    User.findById(req.user.id, '-hash -accessToken -loggedIn -createdAt -updatedAt', function(err, user) {
      // If a error occurs
      if (err) {
        return res.json(500, {
          status: 0,
          error: {
            type: 'system',
            message: 'System Error'
          }
        });
      }

      // Update user profile
      if (req.body.name === 'about') {
        user.about = req.body.value;
      }

      if (req.body.name === 'statusMessage') {
        user.statusMessage = req.body.value;
      }

      if (req.body.name === 'gender') {
        user.gender = req.body.value;
      }

      if (req.body.name === 'screenName') {
        user.screenName = req.body.value;
      }

      if (req.body.name === 'bloodType') {
        user.bloodType = req.body.value;
      }

      if (req.body.name === 'birthday') {
        var birthday = moment(req.body.value, 'YYYY-MM-DD');
        user.birthday = birthday.unix();
      }

      if (req.body.name === 'occupation') {
        user.occupation = req.body.value;
      }

      // Attempt to save the user
      user.save(function(err) {
        // If a error occures
        if (err) {
          return res.json(500, {
            status: 0,
            error: {
              type: 'system',
              message: 'System Error'
            }
          });
        }

        // Send the successful message
        return res.json({
          status: 1,
          message: 'Successfully update the user'
        });
      });
    });
  },

  /*
   * Function to update a user profile Image
   */
  uploadPhoto: function(req, res) {
    // Get the user instance of the current user
    User.findById(req.user.id, function(err, user) {
      // If err
      if (err) {
        return res.redirect(500, '/');
      }

      // Check if there is a file upload
      if (!_.isUndefined(req.files) && !_.isUndefined(req.files.profilePhoto)) {
        //Upload the image file
        console.log('Start upload file:');
        var newFile = req.files.profilePhoto
          , tmpPath = newFile.path
          , oldName = newFile.name
          , extension, newName, newPath;

        // Get the image extension
        extension = oldName.substr(oldName.lastIndexOf('.'));

        // Check file type
        var allowed_extensions = ['.gif', '.GIF', '.png', '.jpeg', '.jpg', '.JPG', '.JPEG'];
        if (!_.contains(allowed_extensions, extension)) {
          req.flash('message', 'ファイルの拡張子が間違いました');
          return res.redirect('/');
        }

        // Create the new file name by hashing the file path
        newName = crypto.createHash('md5').update(tmpPath).digest('hex') + extension;

        // Create the new path for upload image
        if (process.env.NODE_ENV === 'production') {
          newPath = '/home/linhtm/sites/ogorinImage/' + newName;
        } else {
          newPath = './public/images/' + newName;
        }

        // Resize and move the image
        im.resize({
          srcPath: tmpPath,
          dstPath: newPath,
          width: 300
        }, function(err, stdout, stderr) {
          // If err, redirect
          if (err || stderr) {
            req.flash('message', 'Upload image failed');
            return res.redirect(500, '/');
          }

          // If success, delete the old photo
          helpers.deletePhoto(user.profilePhoto);
          // Save the new photoname
          user.profilePhoto = newName;

          // Save the user
          user.save(function(err) {
            // If err
            if (err) {
              return res.redirect(500, '/');
            }

            // Success redirect
            res.redirect('/');
          });
        });
      }
    });
  },

  /*
   * Function to update a user's location
   */
  updateLocation: function(req, res) {
    User.findById(req.user.id, function(err, user) {
      // If a err occured
      if (err) {
        return res.json({
          status: 0,
          error: {
            type: 'system',
            message: 'System Error'
          }
        });
      }

      // Get the longlat from the request
      var lnglat = [parseFloat(req.body.longitude), parseFloat(req.body.latitude)];
      user.lastLocation.coords = lnglat;

      // Attempt to save the user
      user.save(function(err, user) {
        // If a err occured
        if (err) {
          return res.json({
            status: 0,
            error: {
              type: 'system',
              message: 'System Error'
            }
          });
        }

        // Return the successful message
        return res.json({
          status: 1,
          lastLocation: user.lastLocation,
          message: 'Successfully update your location'
        });
      });
    });
    
  },

  /*
   * Function to search for users using location data and return JSON
   */
  searchLocationAPI: function(req, res) {
    // Get the bounds of the map
    var southWest = req.query.bounds.southWest,
        northEast = req.query.bounds.northEast;

    // Create the box to query in Mongo
    var box = [[parseFloat(southWest[1]), parseFloat(southWest[0])], [parseFloat(northEast[1]), parseFloat(northEast[0])]];

    console.log(box);
    // Query to find the users in the bounds
    User.find({ 'lastLocation.coords': { $within: { $box: box } }, type: 'real' }, 'id username profilePhoto status lastLocation', function(err, users) {
      if (err) {
        return res.json({ error: 'System Error' });
      }

      console.log(util.inspect(users));
      return res.json(users);
    });

  },

  /*
   * Function to show a user's profile
   */
  showProfile: function(req, res) {
    // Get the user id
    var userId = req.param('id');

    // if the user id equal current user id, redirect
    if (userId === req.user.id) {
      res.redirect('/');
    }

    // Get the user from the database
    User.findById(userId, function(err, user){
      // Error
      if (err)  {
        console.log(err);
        res.redirect('/');
      }

      // If therer is no user with this id redirect
      if (!user) {
        return res.redirect('/user');
      }

      // Change the birthday of User
      if (!_.isUndefined(user.birthday) && !_.isEmpty(user.birthday)) {
        user.birthday = moment.unix(parseInt(user.birthday, 10)).format('DD/MM/YYYY');
      }

      // Change the format of the gender
      if (!_.isUndefined(user.gender) && !_.isEmpty(user.gender)) {
        user.gender = user.gender.charAt(0).toUpperCase() + user.gender.slice(1);
      }
      
      // Change the format of the user type
      if (user.type === 'fake') {
        user.type = 'アルバイト';
      } else {
        user.type = '実ユーザ';
      }

      // Render the profile page
      return res.render('user/profile', {
        title: 'ユーザー情報',
        slug: 'explore',
        user: user
      });
    });
  },

  /*
   * Function to get the user list
   */
  listUser: function(req, res) {
    // Find all online users
    User.find({ _id: { $ne: req.user.id } }, null, { sort: 'username', limit: 60 }, function(err, users) {
      if (err) {
        return res.render('user/list', {
          title: 'ユーザー検索する',
          slug: 'explore',
        });
      }

      // Render the list view
      res.render('user/list', {
        title: 'ユーザー検索する',
        slug: 'explore',
        users: users,
        page: 1,
        message: req.flash('message')
      });
    });
  },

  /*
   * Function to search for user using username and return JSON
   */
  searchUsernameAPI: function(req, res) {
    // Get the parameters
    var searchKey = req.query.searchKey
      , statusOption = req.query.statusOption
      , userType = req.query.userType;

    console.log(req.query);
    var query;

    // Get the regex string of username
    var usernameRegex = new RegExp(searchKey, 'i');
    // console.log(usernameRegex);

    var itemsPerPage = 60;
    var skipItems = 0;
    // If there is a page number in the query caculate the kip Item
    if (req.query.page) {
      var page = parseInt(req.query.page, 10);

      // If valid page variable, increase the skipItems
      if (_.isNumber(page) && page > 0) {
        skipItems += itemsPerPage * (page - 1);
      }
    }

    // Create the query based on status option
    if (statusOption === 'all' && userType === 'all') {
      query = User.find({ 'username': usernameRegex, _id: { $ne: req.user.id } });
    } else if (statusOption !== 'all' && userType === 'all') {
      query = User.find({ 'username': usernameRegex, _id: { $ne: req.user.id }, 'status': statusOption });
    } else if (statusOption === 'all' && userType !== 'all') {
      query = User.find({ 'username': usernameRegex, _id: { $ne: req.user.id }, type: userType });
    } else {
      query = User.find({ 'username': usernameRegex, _id: { $ne: req.user.id }, 'status': statusOption, type: userType });
    }

    query.skip(skipItems).limit(itemsPerPage).select('id username type profilePhoto email status lastLocation').sort({ username: 1 }).exec(function(err, users) {

      if (err) {
        // return handleError(err);
        return res.json({ error: 'System Error' });
      }

      console.log(util.inspect(users));
      // return json
      return res.json(users);
    });
  }, 

  /*
   * Function to list recent conversation
   */
  recentConversations: function(req, res) {
    redisClient.sort('chat:' + req.user.id + ':conversations', 'BY', 'nosort', 'GET', '#', 'GET', 'chat:' + req.user.id + ':*' + ':lastMessage', 'LIMIT', 0, 60, function (err, replies) {
      if (err) {
        console.log(err);
        res.redirect('/');
      }

      // Log
      console.log(replies);

      // If there is no conversations, return an empty array
      if (replies.length === 0) {
        return res.render('user/converation', {
          conversations: replies,
          slug: 'profile',
          title: '直近の会話'
        });
      }

      var i, partnerIds = [], conversations = [];
      // Create the array of conversations from the replies
      for (i = 0; i < replies.length; i = i + 2) {
        // Create the conversation object
        var converObj = {
          partnerId: replies[i],
          lastMessage: JSON.parse(replies[i + 1])
        };

        // Create the readable time
        converObj.lastMessage.time = moment.unix(parseInt(converObj.lastMessage.timestamp, 10)).calendar();

        // Add the user id to the list of user id
        partnerIds.push(replies[i]);

        // Add to the conversations array
        conversations.push(converObj);
      }

      // Log 
      console.log(conversations);
      console.log(partnerIds);

      // Get the array of user from the mongo database that have userId in the list of userid conversations
      User.find({ '_id': { $in: partnerIds } }, 'status profilePhoto username screenName', function(err, users) {
        // If err
        if (err) {
          console.log(err);
          res.redirect('/');
        }

        // Log
        console.log(users);
        // Iterate through the list of user and create the final results
        _.forEach(users, function(user) {
          // Get the index of current user in the list from redis
          var userIndex = _.indexOf(partnerIds, user.id);

          // Set the status and profile photo for the object in the conversations list
          if (userIndex !== -1) {
            conversations[userIndex].partnerStatus = user.status;
            conversations[userIndex].partnerProfilePhoto = user.profilePhoto;
            conversations[userIndex].partnerUsername = user.username;
            conversations[userIndex].partnerScreenName = user.screenName;
          }
        });

        // Iterate through all the conversation list and mark the the conversation with no status as delete
        _.forEach(conversations, function(conversation) {
          if (!_.has(conversation, 'partnerStatus')) {
            // Mark the status as deleted and profilePhoto as default
            conversation.partnerStatus = 'deleted';
            conversation.partnerProfilePhoto = 'default_avatar.png';
            conversation.partnerUsername = 'Unknown';
            conversation.partnerScreenName = 'Unknown';
          }
        });

        // Return the list of conversations
        return res.render('user/conversation', {
          conversations: conversations.reverse(),
          slug: 'profile',
          title: '直近の会話'
        });
      });
    });
  },

  /*
   * Function for check user's status
   */
  checkUserStatus: function(userId, callback) {
    // Get the user with this ID
    User.findById(userId, function(err, user) {
      if (err) {
        console.log(err);
        return callback(null, err);
      }

      // If there is no user with this id
      if (!user) {
        err = {
          type: 'no-user',
          messsage: 'There is no user with this id'
        };

        return callback(null, err);
      }

      if (user.status === 'online') {
        return callback(true, null);
      }

      // Return true if user is offline
      return callback(false, null);
    });
  },

  /*
   * Function for a user to logout
   */
  logout: function(req, res) {
    // Change the status of user to offline
    if (req.user.status === "online") {
      User.findByIdAndUpdate(req.user.id, { $set: { status: 'offline' } }, function(err, user) {
        if (err) {
          console.log(err);
          return;
        }

        console.log('After Logout: Successfully logout the user (change status)');
        return;
      });
    }
    
    // Passprot logout
    req.logout();
    res.redirect('/');
  },

  /*
   * Function to check for long lat when update location
   */
  checkForLngLat: function(req, res, next) {
    // Check if there is long, lat in the request
    req.check('longitude', 'Invalid Longitude').notEmpty().isFloat().min(-180).max(180);
    req.check('latitude', 'Invalid Latitude').notEmpty().isFloat().min(-90).max(90);
    
    // Create the mapped errors array
    var errors = req.validationErrors(true);

    // Get the errors object and transform it to an array
    var msgArray =  _.map(errors, function(error) {
      return error.msg;
    });

    if (errors) {
      return res.json({
        status: 0,
        error: {
          type: 'location',
          message: msgArray[msgArray.length - 1]
        }
      });
    }

    // Process to the next function
    next();
  },

  /*
   * Function to update password
   */
  updatePassword: function(req, res) {
    // GET request
    if (req.method !== 'POST') {
      return res.render('user/updatePassword', {
        title: 'パスワード変更',
        message: req.flash('message')
      });
    }

    // POST Request
    User.findById(req.user.id, function(err, user) {
      // If err
      if (err) {
        console.log(err);
        req.flash('message', 'System Error');
        return res.redirect('/');
      }

      // Change password
      user.password = req.body.password;

      // Save the user
      user.save(function(err) {
        // If err
        if (err) {
          console.log(err);
          req.flash('message', 'System Error');
          return res.redirect('/');
        }

        req.flash('message', 'パスワードの変更が成功しました');
        return res.redirect('/dashboard/update-password');
      });
    });
  },

  /*
   * Function to update Email
   */
  updateEmail: function(req, res) {
    // GET request
    if (req.method !== 'POST') {
      return res.render('user/updateEmail', {
        title: 'メールアドレス変更',
        message: req.flash('message')
      });
    }

    // POST Request
    User.findByIdAndUpdate(req.user.id, { email: req.body.email }, function(err, user) {
      // If err
      if (err) {
        console.log(err);
        req.flash('message', 'System Error');
        return res.redirect('/');
      }

      req.flash('message', 'メールアドレスの変更が成功しました');
      return res.redirect('/dashboard/update-email');
    });
  },

  /*
   * Function to update user poinst in chat
   */
  updatePoints: function(numMessageSent, numMessageReceived, userId, callback) {
    var mesPerPoint = 10
      , maxPointsPerDay = 50;

    // Log
    console.log('Messages sent: ' + numMessageSent + ' | Messages received: ' + numMessageReceived);
    // Get the user from the database
    User.findById(userId, function(err, user) {
      if (err) {
        console.log('Update point - error getting user');
        return callback(err);
      }

      // If there is no usr with this id
      if (!user) {
        console.log('Update point - error getting user');
        return callback('There is no user with this id');
      }

      // If user gender is male or undefined, do nothing
      if (user.gender !== 'female' || user.type === 'fake') {
        console.log('Update point - user type error');
        return callback('The user must be a female to get point');
      }

      // Reset the pointsToday of user if a day has passed
      if (user.lastPointUpdated) {
        var now = new Date();

        if (now.getFullYear() > user.lastPointsUpdated.getFullYear()) {
          user.pointsToday = 0;
        } else if (now.getMonth() > user.lastPointsUpdated.getMonth()) {
          user.pointsToday = 0;
        } else if (now.getDate() > user.lastPointUpdated.getDate()) {
          user.pointsToday = 0;
        }
      } else {
        user.pointsToday = 0;
      }

      // Calculate points
      if (user.pointsToday >= maxPointsPerDay) {
        console.log('Update point - Max point reached');
        return callback('Max point reached');
      }

      // Get the average points based of number of messsages sent & received
      var pointsToAdd = parseInt(((numMessageSent + numMessageReceived) / 2) / mesPerPoint, 10);
      
      // Log
      console.log('Points to add: ' + pointsToAdd);

      // Calculate the poinst to-add based on the points that user received this day
      pointsToAdd = (user.pointsToday + pointsToAdd) >= maxPointsPerDay ? (maxPointsPerDay - user.pointsToday) : pointsToAdd;

      // Log
      console.log('Points to add: ' + pointsToAdd);

      // Add the points to user 
      user.points += pointsToAdd;
      user.pointsToday += pointsToAdd;
      user.lastPointsUpdated = new Date();

      // Attempt to save the user
      user.save(function(err) {
        if (err) {
          console.log('Update point - error updating user');
          return callback(err);
        }

        return callback(false, user.username, user.points);
      }); 
    });
  },

  /*
   * Function to check for update password
   */
  checkUpdatePassword: function(req, res, next) {
    // Check for password
    req.check('oldPassword', 'パスワードは必須です').notEmpty();
    req.check('password', 'パスワードは6文字以上、20文字以内でなければなりません').len(6, 20);
    req.check('passwordConfirm', 'パスワードとパスワードの確認は一致しなけらばなりません').notEmpty().equals(req.body.password);

    // Create the mapped errors array
    var errors = req.validationErrors(true);

    if (!_.isEmpty(errors)) {
      // Get the error messages
      var msgArray =  _.map(errors, function(error) {
        return error.msg;
      });

      req.flash('message', msgArray[msgArray.length - 1]);
      return res.redirect('/dashboard/update-password');
    }
    
    // Check for the old password
    if (!bcrypt.compareSync(req.body.oldPassword, req.user.hash)) {
      req.flash('message', '旧パスワードは正しくありません');
      return res.redirect('/dashboard/update-password');
    }

    return next();
  },

  /*
   * Function to check for updating email
   */
  checkUpdateEmail: function(req, res, next) {
    // Check for email
    req.check('email', 'メールアドレスは正しくありません').len(6, 64).isEmail();

    // Create the mapped errors array
    var errors = req.validationErrors(true);

    if (!_.isEmpty(errors)) {
      // Get the error messages
      var msgArray =  _.map(errors, function(error) {
        return error.msg;
      });

      req.flash('message', msgArray[msgArray.length - 1]);
      return res.redirect('/dashboard/update-email');
    }

    return next();
  }

};
