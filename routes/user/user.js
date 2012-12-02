var User = require('../../models/user')
  , moment = require('moment')
  , _ = require('lodash')
  , helpers = require('./helpers')
  , crypto = require('crypto')
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
    // If current user status is offline, change the statsu
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
  
    // Render the profile page for user
    res.render('user/profile', {
      title: 'Your profile',
      user: req.user,
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
        var allowed_extensions = ['.png', '.jpeg', '.jpg', '.JPG', '.JPEG'];
        if (!_.contains(allowed_extensions, extension)) {
          req.flash('message', 'Upload image failed: you can only upload a image');
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
  }
};
