$(function() {
  // Hide the logout
  $('#gotin').hide();
  // Disable the input for message and partner
  $('#message').prop('disabled', true);
  $('#partner *').prop('disabled', true);


  var partnerId;
  var socket;
  // When click button to get in
  $('#getin').on('click', function(e) {
    e.preventDefault();
    var userId = $('#user-id').val();
    socket = io.connect('http://49.212.161.19:3100?userId=' + userId);
    socket.on('welcome', function (data) {
      console.log(data);
      // Show the logged in info
      $('#user-form').hide();
      $('#gotin').show();
      $('.status').text($('.status').text() + ' ' + userId);
      
      // Enable the find partner input
      $('#partner *').prop('disabled', false);
    });

    socket.on('message-arrived', function(data) {
      console.log(data);
      var messageHtml = '<p>' + '<strong>' + data.senderId + '</strong>: ' + data.message + '</p>';
      $('#chat-box').html($('#chat-box').html() + messageHtml);
    });
  });

  // When chatwith button click, enable chat message, assign the partnerId to the global variable
  $('#partner-id').keypress(function(e) {
    if (e.which === 13) {
      partnerId = $('#partner-id').val();
      $('#message').prop('disabled', false);
    }

    return;
  });

  // When a message is enter send the message to specific client
  $('#message').keypress(function(e) {
    if (e.which === 13) {
      var message = $('#message').val();
      var timestamp = Math.round(+new Date()/1000);
      socket.emit('message', { receiverId: partnerId, message: message, timestamp: timestamp });

      var messageHtml = '<p><strong>You: </strong>' + '<em>@' + partnerId +'</em> ' + message + '</p>'; 
      $('#chat-box').html($('#chat-box').html() + messageHtml);
    } 

    return;
  });

});
