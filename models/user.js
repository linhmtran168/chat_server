/*
 * Models for User
 */
var mongoose = require('mongoose')
  , bcrypt = require('bcrypt')
  , util = require('util')
  , _ = require('lodash')
  // , gm = require('googlemaps')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

// Define the schema
var userSchema = new Schema({
  username: { type: String, required: true, index: { unique: true }},
  email: { type: String, required: true, index: { unique: true }},
  hash: { type: String, required: true },
  profilePhoto: { type: String },
  screenName: { type: String },
  about: { type: String },
  gender: { type: String, enum: ['male', 'female'], index: true },
  status: { type: String, enum: ['offline', 'online', 'banned'], default: 'online', index: true },
  occupation: { type: String },
  bloodType: { type: String },
  birthday: { type: String },
  statusMessage: { type: String },
  lastLocation: {
    name: { type: String, index: true },
    coords: { type: Array, index: '2d' }
  },
  favoriteUsers: [{ type: ObjectId, ref: 'User' }],
  loggedIn: { type: String },
  accessToken: { type: String, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true }
});

userSchema.pre('save', function(next) {
  // Update timestamp
  this.updatedAt = new Date();

  // Initial update user avatar based on gender
  if (_.isUndefined(this.profilePhoto) || _.isEmpty(this.profilePhoto) || this.profilePhoto === 'male_avatar.png' || this.profilePhoto === 'female_avatar.png') {
    if (_.isUndefined(this.gender)) {
      this.profilePhoto = 'default_avatar.png';
    }

    if (this.gender === 'male') {
      this.profilePhoto = 'male_avatar.png';
    }

    if (this.gender === 'female') {
      this.profilePhoto = 'female_avatar.png';
    }
  }

  next();
});


// Update last Location name
// userSchema.pre('save', function(next) {
//   var that = this;
//   // Call the google api to get the formatted address
//   console.log(util.inspect(this.lastLocation.coords[1] + ',' + this.lastLocation.coords[0]));
//   gm.reverseGeocode(this.lastLocation.coords[1] + ',' + this.lastLocation.coords[0], function(err, data) {
//     if (err) {
//       console.log(util.inspect(err));
//       next();
//     } else {
//       console.log(util.inspect(data, true, null, true));
//       that.lastLocation.name = data.results[0].formatted_address;
//       next();
//     }
//   });
// });

// Create the virtual attribute password
userSchema.virtual('password').set(function(password) {
  // User bcrypt to hash the password
  var salt = bcrypt.genSaltSync(10);
  this.hash = bcrypt.hashSync(password, salt);
});

// Function to create the accessToken for a user
userSchema.methods.createAccessToken = function(callback) {
  var salt = bcrypt.genSaltSync(10);
  // Create the accesstoken
  this.accessToken = bcrypt.hashSync(this.id + this.password + this.loggedIn, salt);
  // Change the user status
  this.status = 'online';
  this.save(callback);
};

// Method to verify password
userSchema.method('verifyPassword', function(password, callback) {
  bcrypt.compare(password, this.hash, callback);
});

// Method to login a user
userSchema.static('authenticate', function(username, password, callback) {
  this.findOne({ username: username }, function(err, user) {
    // If error return error          
    console.log(util.inspect(user));
    if (err) {
      return callback(err, false, { message: "System error" });
    }

    // If no user return false
    if (!user) {
      return callback({ type: 'no-user' }, false, { message: "No user with this username" });
    }

    // Verify Password
    user.verifyPassword(password, function(err, isCorrect) {
      // If error
      if (err) {
        return callback(err, false, { message: "System error" });
      }

      // If password not corret return false
      if (!isCorrect) {
        return callback({ type: 'password' }, false, { message: "Wrong password" });
      }

      // If user is banned return false
      if (user.status === "banned") {
        return callback({ type: 'banned' }, false, { message: "You are currently banned" });
      }

      // Return the user
      return callback(null, user, { message: "Successfully logged in" });
    });
  });
});
var User = mongoose.model('User', userSchema);
module.exports = User;
