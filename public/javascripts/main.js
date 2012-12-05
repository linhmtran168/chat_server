$(function() {

  /* 
   * Current user profile view,
   */
  // Load function for x-editatable
  if ($('#info-box').length !== 0) {
    // Initialize x-editatble
    OG.editable.initialize();
    
    // Initialize map
    if ($('#latitude').val() !== 'undefined' && $('#longitude').val() !== 'undefined') {
      // Initialzie the map
      $('.notice-location').html('<em>Move the marker & click the button to set your location</em>');
      OG.map.initialize($('#latitude').val(), $('#longitude').val(), 'profile-map');

      // Add the marker
      OG.map.addNormalMarker($('#latitude').val(), $('#longitude').val(), true);
    } else {
      // Initial the default map
      console.log('Initialize default location: Tokyo');
      $('.notice-location').html('<em>Your location hasn\'t been set. Move the marker & click the button to set your location</em>');
      OG.map.initialize(35.689487, 139.691706, 'profile-map');
      OG.map.addNormalMarker(35.689487, 139.691706, true);
    }

    // Update location when update location button is clicked
    $('#update-location').click(function(e) {
      e.preventDefault();

      // Call the method to update location
      OG.connect.updateLocation($('#longitude').val(), $('#latitude').val(), function(err, data) {
        // Update the notice message based on the result
        if (err) {
          $('.notice-location').removeClass('text-info').addClass('text-error').html('<em>' + err.message + '</em>');
        } else {
          console.log(data);
          if (data) {
            console.log('abc');
            $('.notice-location').removeClass('text-info').addClass('text-success').html('<em>' + data.message + '</em>');
          }
        }
      });
    });
  }

  /*
   * If is the profile view, and have a #map, initialize the map
   */
  if ($('#map').length !== 0) {
    // Initialize the map
    if ($('#latitude').val() !== 'undefined' && $('#longitude').val() !== 'undefined') {
      OG.map.initialize($('#latitude').val(), $('#longitude').val(), 'map');
      // Add the marker
      OG.map.addNormalMarker($('#latitude').val(), $('#longitude').val(), false);
    } else {
      // Initial the default map
      console.log('Initilaize default location: Tokyo');
      OG.map.initialize(35.689487, 139.691706, 'map');
    }
  }

  // Chat part
  if ($('#chat-box-profile').length !== 0) {
    var currentUserId = $('#current-user').val()
      , userId = $('#user-id').val()
      , username = $('#username').text();
    // Initialize chat
    OG.chat.initialize(currentUserId, userId, username);

    // Setting the socket to handler received message
    OG.chat.socket.on('message-arrived', OG.chat.messageArriveHandler);
    // When a message is enter, send the message to specific client
    $('#message').keypress(function(e) {
      if (e.which === 13) {
        e.preventDefault();
        OG.chat.sendMessage();
      } 
    });

    // When the send button was click, send mesage
    $('#send').click(function(e) {
      OG.chat.sendMessage();
    });
  }


  /*
   * Search by location part
   * If this is the index view and have a #map-index initialize the map
   */
  if ($('#index-map').length !== 0) {
    // Prevent form default action
    $('#location-form').submit(function(e) {
      e.preventDefault();
      return false;
    });

    // Later use
    // $('#search-location').keydown(function(e) {
    //   if (e.keyCode === 13) {
    //     google.maps.event.trigger(OG.map.autocomplete, 'place_changed');
    //   }
    // });

    // Default to Tokyo
    OG.map.initialize(35.689487, 139.691706, 'index-map');
    OG.map.locate();

    // Initialize place autocompletion
    OG.map.initializePlaces('search-location');

  }

  /*
   * Search by user part
   */
  $('#user-form').submit(function(e) {
    e.preventDefault();
    // Call the method to send request to server
    OG.connect.getUsers();

    return false;
  });

});
