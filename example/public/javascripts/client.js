requirejs.config({
  baseUrl: '/javascripts',
  paths: {
    vendor: 'vendor',
    ofio: 'vendor/ofio',
    io: 'vendor/socket.io.min',
    _: 'vendor/underscore-min'
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
  var socket = io.connect('http://localhost:3000/as_client');

  //----------------------------------------------------------- СТАВИТЬ ЛОКАЛХОСТ ИЛИ ЭТОТ АЙПИ?? --82.166.192.202


  var forms = new FormsManager({
    socket: socket,
    el: document.body
  });

  socket.on('available servers', function (data) {

      console.log('socket.on(available servers:', data.servers)   ;
    forms.remove_all_forms();
    forms.create_forms(data.servers);
  });

  socket.on('new server', function (data) {
    forms.create_form(data);
  });

  socket.on('servers disconnected', function (data) {
    forms.remove_forms(data.ids);
  });

  socket.on('error', function (error) {
    console.error(error.message);
  });

  socket.on('data', function (data) {
    console.log('socket.on(data:', data)   ;
    var form = forms.get_by_id(data.from);
    form.log_data(data);
  });
});