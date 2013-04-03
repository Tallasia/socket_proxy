var name = prompt('Type the server name');
var socket = io.connect('http://localhost:3000/as_server');
var log = function (text) {
    $('<div/>').text(text).appendTo('body');
};

socket.on('connect', function () {
    log('socket connected');
    socket.emit('register', {
    name: name
    });
});

socket.on('error', function (error) {
    log('Error: ' + error.message);
    });

socket.on('data', function (data) {
    log('Message received: "' + data.text + '" from ' + data.from + '. Send it back');
    data.to = data.from;
    delete data.from;
    socket.emit('data', data);
    });