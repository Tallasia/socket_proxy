var io = require('socket.io');

module.exports = ProxySocketServer;

function ProxySocketServer(params) {
  this._init(params);
}


ProxySocketServer.prototype._init = function (params) {
  this._port = params['port'] || 80;
  this._flash_port = params['flash_port'] || 10843;
  this._io = null;
  this._servers_io = null;
  this._clients_io = null;

  this._init_sockets_connection();
  process.on('exit', this._turn_off.bind(this));
};


ProxySocketServer.prototype._init_sockets_connection = function () {
  this._io = io.listen(this._port, {
    'flash policy port': this._flash_port
  });

  this._servers_io = this._io
    .of('/as_server')
    .on('connection', this._register_server_connection.bind(this));

  this._clients_io = this._io
    .of('/as_client')
    .on('connection', this._register_client_connection.bind(this));
};


ProxySocketServer.prototype._register_server_connection = function (socket) {
  this._io.log.info('Proxy: register server');

  this._clients_io.emit('new server', {
    id: socket.id
  });

  socket.on('disconnect', this._disconnect_servers.bind(this, [socket.id]));
  socket.on('data', this._send_to.bind(this, this._clients_io, socket));
};


ProxySocketServer.prototype._disconnect_servers = function (sockets_ids) {
  this._clients_io.emit('servers disconnected', {
    ids: sockets_ids
  });
};


ProxySocketServer.prototype._register_client_connection = function (socket) {
  this._io.log.info('Proxy: register client');
  socket.emit('available servers', {
    ids: this._get_servers_ids()
  });

  socket.on('data', this._send_to.bind(this, this._servers_io, socket));
};


ProxySocketServer.prototype._get_servers_ids = function () {
  return this._servers_io.clients().map(function (client) {
    return client.id;
  });
};


ProxySocketServer.prototype._turn_off = function () {
  this._disconnect_servers(this._get_servers_ids());
};


ProxySocketServer.prototype._send_to = function (to_io, from_socket, data) {
  var destination = to_io.sockets[data.to];
  if (!destination) {
    from_socket.emit('error', {
      message: data.to + ' does not found'
    });
    return;
  }

  delete data.to;
  data.from = from_socket.id;
  destination.emit('data', data);
};