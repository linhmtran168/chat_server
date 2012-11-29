$(function() {

  /*
   * If is the profile view, and have a #map, initialize the map
   */
  if ($('#map').length !== 0) {
    // Initialize the map
    if ($('#latitude').val() !== 'undefined' && $('#longitude').val() !== 'undefined') {
      OG.map.initialize($('#latitude').val(), $('#longitude').val(), 'map');
      // Add the marker
      OG.map.addNormalMarker($('#latitude').val(), $('#longitude').val(), 'map');
    } else {
      // Initial the default map
      console.log('abc');
      OG.map.initialize(35.689487, 139.691706, 'map');
    }
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

  /*
   * Search for parttimer part
   */
  $('#parttimer-form').submit(function(e) {
    e.preventDefault();
    // Call the method to send request to sever
    OG.connect.getParttimers();

    return false;
  });

  /*
   * Create pattimer form validation
   */
  $('#create-parttimer input').not('[type=submit]').jqBootstrapValidation();

});
