var io = require('socket.io');

module.exports = ProxySocketServer;

/**
 * Proxy server which connect a clients and another servers by WebSockets protocol
 * @param {Object} [params]
 * @param {Number} [params.port] The server will listen that port
 * @param {Object} [params.io_options] Options for Socket.IO
 * @class ProxySocketServer
 * @example Usage
 * <code class="javascript">
 * var ProxyServer = require('sockets_proxy');
 * new ProxyServer({
 *   port: 3000,
 *   io_options{
 *     'flash policy port': 843
 *   }
 * });
 * </code>
 */
function ProxySocketServer(params) {
  this._init(params);
}

/**
 * @constructor
 * @param {Object} [params] see {@link ProxySocketServer}
 * @private
 */
ProxySocketServer.prototype._init = function (params) {
  /**
   * The server will listen that port
   * @type {Number}
   * @private
   */
  this._port = params['port'] || 80;

  /**
   * Options for Socket.IO
   * @type {Object}
   * @private
   */
  this._io_options = params['io_options'] || {};

  /**
   * Socket.IO server
   * @private
   */
  this._io = null;

  /**
   * Socket.IO namespace for servers
   * @private
   */
  this._servers_io = null;

  /**
   * Socket.IO namespace for clients
   * @private
   */
  this._clients_io = null;

  this._init_sockets_connection();
  process.on('exit', this._turn_off.bind(this));
};


/**
 * Initialize socket connection, starting listen servers and clients
 * @private
 */
ProxySocketServer.prototype._init_sockets_connection = function () {
  this._io = io.listen(this._port, this._io_options);

  this._servers_io = this._io
    .of('/as_server')
    .on('connection', this._register_server_connection.bind(this));

  this._clients_io = this._io
    .of('/as_client')
    .on('connection', this._register_client_connection.bind(this));
};

/**
 * Register connected server and notify all connected clients about that
 * @param {Socket} socket
 * @private
 */
ProxySocketServer.prototype._register_server_connection = function (socket) {
  this._io.log.info('Proxy: register server');

  this._clients_io.emit('new server', {
    id: socket.id
  });

  socket.on('disconnect', this._disconnect_servers.bind(this, [socket.id]));
  socket.on('data', this._send_to.bind(this, this._clients_io, socket));
};


/**
 * Notify clients about disconnected servers
 * @param {String[]} sockets_ids
 * @private
 */
ProxySocketServer.prototype._disconnect_servers = function (sockets_ids) {
  this._clients_io.emit('servers disconnected', {
    ids: sockets_ids
  });
};


/**
 * Register client connection and send to this client info about available servers
 * @param {Socket} socket
 * @private
 */
ProxySocketServer.prototype._register_client_connection = function (socket) {
  this._io.log.info('Proxy: register client');
  socket.emit('available servers', {
    ids: this._get_servers_ids()
  });

  socket.on('data', this._send_to.bind(this, this._servers_io, socket));
};


/**
 * Return ids array of connected servers
 * @return {String[]}
 * @private
 */
ProxySocketServer.prototype._get_servers_ids = function () {
  return this._servers_io.clients().map(function (client) {
    return client.id;
  });
};


/**
 * Try notify clients about application is closing
 * @private
 */
ProxySocketServer.prototype._turn_off = function () {
  this._disconnect_servers(this._get_servers_ids());
};


/**
 * Send message to client or server
 * @param {Namespace} to_io Socket.IO namespace which contains recipient
 * @param {Socket} from_socket Socket from which data is sending
 * @param {Object} data sending data
 * @private
 */
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