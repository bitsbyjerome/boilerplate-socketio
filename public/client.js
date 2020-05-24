$(document).ready(function() {
  var socket = io();
  //   socket.on('usercount', function(data){
  //   console.log('a user is connected');
  // });

  socket.on('user', function(data){
    $('#num-users').text(data.currentUsers+' users online');
    var message = data.name;
    if(data.connected) {
      message += ' has joined the chat.';
    } else {
      message += ' has left the chat.';
    }
    $('#messages').append($('<li>').html('<b>'+ message +'<\/b>'));
  });

  $('form').submit(function(e){
    e.preventDefault();
    let messageToSend = $('#m').val();
    console.log('message: '+messageToSend)
    socket.emit('chat message', messageToSend);
    $('#m').val('');
  })

  socket.on('chat message',(data)=>{
    console.log('chat message: '+ data);
    $('#messages').append($('<li>').html('<b>'+ data.name+': '+data.message +'<\/b>'));
  })

});