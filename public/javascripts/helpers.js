(function() {
  "use strict";

  // Mixin for lodash
  _.mixin({
    'capitalize': function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
  });
  
  // Main name space for the app
  window.OG = window.OG || {};

  /* 
   * Module for map
   */
  window.OG.map = {

    /*
     * Variables
     */
    map: '',
    autocomplete: '',
    usersLayerGroup: '',
    userMarkers: [],
    /*
     * Initialize the map
     */
    initialize: function(lat, lng, div) {
      // Create the map in
      console.log(lat + ', ', lng);
      this.map = L.map(div).setView([parseFloat(lat), parseFloat(lng)], 13);

      L.tileLayer('http://{s}.tile.cloudmade.com/45d025692aef4f129f320541b2597162/997/256/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
      }).addTo(this.map);

      // Create the layer group for holding user markers
      this.usersLayerGroup = L.layerGroup().addTo(this.map);
      // Add the eventlistener to the map
      OG.map.map.on('moveend', OG.connect.getMapMarkers);
    },

    /*
     * Add marker to the map
     */
    addMarker: function(lat, lng, user) {
      var marker;

      if (user.gender === 'male') {
        marker = L.marker([parseFloat(lat), parseFloat(lng)]);
      } else if (user.gender === 'female') {
        var pinkIcon = L.icon({
          iconUrl: 'http://49.212.161.19:3050/marker_pink.png',
          shadowUrl: 'http://49.212.161.19:3050/marker_shadow.png',
          popupAnchor: [14, 7],
        });
        marker = L.marker([parseFloat(lat), parseFloat(lng)], { icon: pinkIcon });
      } else {
        var grayIcon = L.icon({
          iconUrl: 'http://49.212.161.19:3050/marker_gray.png',
          shadowUrl: 'http://49.212.161.19:3050/marker_shadow.png',
          popupAnchor: [14, 7],
        });
        marker = L.marker([parseFloat(lat), parseFloat(lng)], { icon: grayIcon });
      }

      var label;
      if (user.status === 'online') {
        label = 'label-success';
      } else if (user.status === 'banned') {
        label = 'label-important';
      } else {
        label = '';
      }

      marker.bindPopup(
        '<div class="pop-up">' +
        '<a href="/user/' + user._id + '">' +
        '<strong>' + user.username + '</strong>' +
        '<img class="img-rounded" src="http://49.212.161.19:3050/' + user.profilePhoto + '">' + 
        '</a>' + 
        '<span class="label + ' + label + '">' + _(user.status).capitalize() + '</span>' +
        '</div>', {
        maxWidth: 80,
        maxHeight: 120
      });
      marker.on('mouseover', marker.openPopup.bind(marker));
      this.usersLayerGroup.addLayer(marker);
    },

    /*
     * Add normal marker to map (without popup)
     */
    addNormalMarker: function(lat, lng, draggable) {
      var redIcon = L.icon({
        iconUrl: 'http://49.212.161.19:3050/marker_red.png',
        shadowUrl: 'http://49.212.161.19:3050/marker_shadow.png'
      });
      
      var marker = L.marker([lat, lng], { icon: redIcon, draggable: draggable });
      marker.addTo(this.map);

      // If draggable, add event to get the longlat
      if (draggable) {
        marker.on('dragend', function(e) {
          // Get the long lat
          var latlng = marker.getLatLng();
          console.log(latlng);
          // Update the 2 hidden input
          $('#latitude').val(latlng.lat);
          $('#longitude').val(latlng.lng);
        });
      }
    },

    /*
     * Add user to maps
     */
    addUsersToMaps: function(users) {
      this.usersLayerGroup.clearLayers();

      // Add the new marker to the group layer
      var that = this;
      _(users).each(function(user) {
        // If this is profile view do not display the user
        if ($('#user-id').val() !== user._id) {
          that.addMarker(user.lastLocation.coords[1], user.lastLocation.coords[0], user);
        }
      });

    },

    /*
     * Helper function fired when user location found
     */
    onLocationFound: function(e) {
      // Get the radius
      var radius = e.accuracy / 2;
      
      // Create the ucrrent user location circle and add to map
      var circle = L.circle(e.latlng, radius, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
      });

      console.log(circle);
      // Create the popup
      circle.bindPopup('You are here');

      // Add the circle to the map
      OG.map.map.addLayer(circle);

      // Call the server to get the map markers
      OG.connect.getMapMarkers();
    },

    /*
     * Helper function fired when geolocatoion fails
     */
    onLocationError: function(e) {
      // alert(e.message);
      // Call the server to get the map markers
      OG.connect.getMapMarkers();
    },

    /*
     * Function to locate user location
     */
    locate: function() {
      this.map.locate({setView: true, maxZoom: 17});
      this.map.on('locationfound', this.onLocationFound);
      this.map.on('locationerror', this.onLocationError);
    },

    /*
     * Function to create places auto complete using google serivce
     */
    initializePlaces: function(id) {
      var input = document.getElementById(id);
      // Create the option for autocomplete service
      var options = {
        types: ['(regions)'],
      };

      // Add autocomplete to the input
      this.autocomplete = new google.maps.places.Autocomplete(input, options);

      var that = this;

      // Add event listener to the autocomplete input
      google.maps.event.addListener(this.autocomplete, 'place_changed', function() {
        // Get the place
        var place = that.autocomplete.getPlace();
        if (!place.geometry) {
          return;
        }

        // If the place has a geometry, present it on the map
        if (place.geometry.viewport) {
          // get the bounds and convert it to leaflet
          var northEast = place.geometry.viewport.getNorthEast(),
              southWest = place.geometry.viewport.getSouthWest();

          southWest = new L.LatLng(southWest.lat(), southWest.lng());
          northEast = new L.LatLng(northEast.lat(), northEast.lng());
          var bounds = new L.LatLngBounds(southWest, northEast);

          // Fit the bounds
          that.map.fitBounds(bounds);
          // Call the web server to return the users in the map bound
          // OG.connect.getMapMarkers();
        } else {
          that.map.panTo(new L.LatLng(place.geometry.location.lat(), place.geometry.location.lng()));
          // Call the web server to return the users in the map bound
          // OG.connect.getMapMarkers();
        }

      });
    }
  };

  /*
   * Module to connect to the api
   */
  window.OG.connect = {

    // Variable to indicate there is a request tor not
    isRequesting: false,

    /*
     * Function to get users location from the server
     */
    getMapMarkers: function() {
      // Send the bounds of the map to the server and get the users
      var bounds = OG.map.map.getBounds();
      // Create the data
      var data = {  
        bounds: {
          southWest: [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
          northEast: [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
        }
      };

      // console.log(data);

      // Call the server
      $.get('/user/search-location-api', data, function(data) {
        // console.log(data);
        // If there is no error
        if (data.length > 0 && typeof(data.error) === 'undefined') {
          OG.map.addUsersToMaps(data);
        }
      });
    },

    /*
     * Function to get list of users when search for username
     */
    getUsers: function() {
      // Create the data object to send to the server
      var data = {
        searchKey: $('#search-username').val(),
        statusOption: $('select[name=statusOption]').val(),
        userType: $('select[name=userType]').val()
      };

      // Clear the list
      $('#users-grid').empty();
      // Show loading icon
      $('.load-more').show();
      // Reset page value
      $('#current-page').val(1);

      OG.connect.isRequesting = true;
      // Send the request to the server
      $.get('/user/search-username-api', data, function(data) {
        console.log(data);
        if (data.length > 0 && typeof(data.error) === 'undefined') {
          // console.log("abc");
          OG.ui.addUserGrid(data);
          OG.connect.isRequesting = false;
        }

      });
    },

    /*
     * Function to get more parttimers
     */
    getMoreUsers: function(page) {
      // Create the data object to send to the server
      var data = {
        searchKey: $('#search-username').val(),
        statusOption: $('select[name=statusOption]').val(),
        userType: $('select[name=userType]').val(),
        page: page + 1,
      };

      // Show loading icon
      $('.load-more').show();

      OG.connect.isRequesting = true;

      // Send the request to the server
      $.get('/user/search-username-api', data, function(data) {
        console.log(data);
        $('.load-more').hide();
        if (data.length > 0 && typeof(data.error) === 'undefined') {
          // console.log("abc");
          $('#current-page').val(page + 1);
          OG.ui.addUserGrid(data);
          OG.connect.isRequesting = false;
        }

      });
    },

    /*
     * Function to update user location
     */
    updateLocation: function(longitude, latitude, callback) {
      // Create the data object to send to the server
      var data = {
        _csrf: $('#csrf').val(),
        longitude: longitude,
        latitude: latitude
      };

      // Send the request to the serer
      $.post('/user/update-location', data, function(data) {
        console.log(data);
        if (data.status === 1) {
          console.log('Draogn Linh');
          callback(null, data);
        } else {
          callback(data.error, false);
        }
      });
    }
  };

  /*
   * Module to change the UI of the app
   */
  window.OG.ui = {
    /*
     * Function to add the user image tile to the user index
     */
    addUserGrid: function(users) {
      // Create the inner html for the list
      var gridHtml = '';

      // Generate the content
      _(users).each(function(user){
        // Get the label for this user
        var label;
        if (user.status === 'online') {
          label = 'label-success';
        } else if (user.status === 'banned') {
          label = 'label-important';
        } else {
          label = '';
        }

        gridHtml += '<li class="span2">' +
          '<div class="thumbnail">' +
            '<div class="thumbnail-img-div">' +
              '<a href="/user/' + user._id +'">' +
                '<img src="http://49.212.161.19:3050/' + user.profilePhoto + '">' +
              '</a>' +
            '</div>' +
            '<div class="caption">' +
              '<h5>' + user.username + '</h5>' +
              '<p>' + 
                '<em>ステータス:&nbsp;</em>' +
                '<span class="label ' + label + '">' + user.status.toUpperCase() + '</span>'+
              '</p>' +
            '</div>' +
          '</div>' + '</li>';

        // console.log(gridHtml);

      });

      // add the content to the view
      $('#users-grid').html($('#users-grid').html() + gridHtml);
    }
  };

  /*
   * Module to integreate x-editatble to the app
   */
  window.OG.editable = {
    /*
     * Function to intialize x-ediatable
     */
    initialize: function() {
      // Initialize the update url and the _csrf key
      var updateUrl = '/user/update';
      var csrfKey = $('#csrf').val();

      // Add editable function to the input
      $('#gender').editable({
        source: [
          { value: 'male', text: 'Male' },
          { value: 'female', text: 'Female' }
        ],
        url: updateUrl,
        params: {
          '_csrf': csrfKey
        }
      });

      $('#status-message').editable({
        url: updateUrl,
        params: {
          '_csrf': csrfKey
        }
      });

      $('#screen-name').editable({
        url: updateUrl,
        params: {
          '_csrf': csrfKey
        }
      });

      $('#blood-type').editable({
        source: [
          { value: 'AB', text: 'AB' },
          { value: 'O', text: 'O' },
          { value: 'A', text: 'A' },
          { value: 'B', text: 'B' },
        ],
        url: updateUrl,
        params: {
          '_csrf': csrfKey
        },
      });
      
      $('#occupation').editable({
        url: updateUrl,
        params: {
          '_csrf': csrfKey
        }
      });

      $('#about').editable({
        url: updateUrl,
        params: {
          '_csrf': csrfKey
        }
      });

      $('#birthday').editable({
        format: 'yyyy-mm-dd',
        viewformat: 'dd/mm/yyyy',
        datepicker: {
          weekStart: 1
        },
        url: updateUrl,
        params: {
          '_csrf': csrfKey
        }
      });
    }
  };

  /*
   * Module for chat
   */
  window.OG.chat = {
    /*
     * Function to initialize socket.io
     */
    initialize: function(currentUserId, userId, username) {
      this.currentUserId = currentUserId;
      this.userId = userId;
      this.username = username;
      this.socket = io.connect('http://49.212.161.19:3100?userId=' + currentUserId);

      this.socket.on('welcome', function(data) {
        console.log(data.message);
      });
    },

    /*
     * Function to handle arrived message
     */
    messageArriveHandler: function(data) {
      // If this is a message from another user (not the use with current profile), do nothint
      console.log(data);
      console.log(OG.chat.userId);

      if (data.senderId !== OG.chat.userId) {
        return;
      }

      // Notify that received message successfully
      OG.chat.socket.emit('message-received');

      // Create message html and add to the dom
      var time = moment.unix(parseInt(data.timestamp, 10));
      var chatDiv = $('#chat-box-profile');
      var messageHtml = '<p>' + '<span class="text-info"><strong>' + OG.chat.username + '</strong> <em>(' + time.calendar() + ')</em>:</span> ' + data.message + '</p>';
      chatDiv.append(messageHtml);
      // Scroll to the bottom of the chat div
      chatDiv.scrollTop(chatDiv.prop('scrollHeight') - chatDiv.height());

      return;
    },

    /*
     * Function to send message to another user
     */
    sendMessage: function() {
      // Get the message
      var message = $('#message').val();
      // Get the timestamp
      var timestamp = Math.round(+new Date()/1000);
      // Send the message
      OG.chat.socket.emit('message', { receiverId: OG.chat.userId, message: message, timestamp: timestamp });

      // Add the message to the dom
      var time = moment.unix(parseInt(timestamp, 10));
      var chatDiv = $('#chat-box-profile');
      var messageHtml = '<p><span class="text-error"><strong>You</strong> <em>(' + time.calendar() + ')</em>:</span> ' + message + '</p>'; 
      chatDiv.append(messageHtml);

      // Scroll to the bottom of the chat div
      chatDiv.scrollTop(chatDiv.prop('scrollHeight') - chatDiv.height());
      // Delete the message in the text input 
      $('#message').val('');
      $('#message').focus();
    }
  };

}());

