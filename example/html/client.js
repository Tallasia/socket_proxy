requirejs.config({
  baseUrl: '../../lib/client',
  paths: {
    vendor: '../../vendor',
    ofio: '../../vendor/ofio',
    io: '../../vendor/socket.io.min',
    _: '../../vendor/underscore-min'
  },
  shim: {
    io: {
      exports: 'io'
    },
    _: {
      exports: '_'
    }
  }
});

requirejs(['FormsManager', 'io', 'shim'], function (FormsManager, io) {
  var socket = io.connect('http://82.166.192.202:8080/as_client');
  var forms = new FormsManager({
    socket: socket
  });

  socket.on('available servers', function (data) {
    forms.create_forms(data.ids);
  });

  socket.on('new server', function (data) {
    forms.create_form(data.id);
  });

  socket.on('servers disconnected', function (data) {
    forms.remove_forms(data.ids);
  });

  socket.on('error', function (error) {
    console.error(error.message);
  });

  socket.on('data', function (data) {
    var form = forms.get_by_id(data.from);
    form.log_data(data);
  });
});