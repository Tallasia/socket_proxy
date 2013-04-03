var io = require('socket.io');
var cookie = require('../example/node_modules/cookie/index.js');
var connect = require('connect');
/**
 * Proxy server which connect a clients and another servers by WebSockets protocol
 * @param {Object} [params]
 * @param {Number} [params.port] The server will listen that port
 * @param {Object} [params.io_options] Options for Socket.IO
 * @class ProxySocketServer
 * @example Usage
 * <code class="javascript">
 * var ProxyServer = require('sockets_proxy');
 * var proxy = new ProxyServer({
 *   port: 3000,
 *   io_options{
 *     'flash policy port': 843
 *   }
 * });
 *
 * // we can filter and forbid some connections
 * proxy.filter = function(client, server){
 *   return true;
 * }
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
//    console.log('ProxySocketServer.prototype._init', arguments, params);
    /**
     * Options for Socket.IO
     * @type {Object}
     * @private
     */
    this._io_options = params['io_options'] || {};
//    console.log('ProxySocketServer.prototype._init _io_options', this._io_options);
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

    this._servers = {};

    this.sessionOptions = params.sessionOptions || null;

    this._init_sockets_connection();
    process.on('exit', this._turn_off.bind(this));
};


/**
 * Initialize socket connection, starting listen servers and clients
 * @private
 */
ProxySocketServer.prototype._init_sockets_connection = function () {
    this._io = io.listen(this._port, this._io_options);
    var self = this;
    this._io.set('authorization', function (data, accept) {
        if (!data.headers.cookie)
            return accept('No cookie transmitted.', false);
        var parsedCookie = cookie.parse(data.headers.cookie);
        var secret = self.sessionOptions.secret;
        data.cookie = parsedCookie[self.sessionOptions.key];
        data.sessionID = connect.utils.parseSignedCookie(data.cookie, secret);
        self.sessionOptions.store.load(data.sessionID, function (err, session) {
            if (err || !session) {
                return accept('Error', false);
            }
            data.session = session;
            session.reload(function () {
                var val = 'nobody';
                if (session.passport.user)
                    val = session.passport.user.username;
                session.value = val;
                session.touch().save();
            });
            return accept(null, true);
        });
    });
    this._servers_io = this._io
        .of('/as_server')
        .on('connection', this._wait_for_server_name.bind(this));

    this._clients_io = this._io
        .of('/as_client')
        .on('connection', this._register_client_connection.bind(this));
};


ProxySocketServer.prototype._wait_for_server_name = function (socket) {
    socket.on('register', this._register_server_connection.bind(this, socket));
};

/**
 * Register connected server and notify all connected clients about that
 * @param {Socket} socket
 * @param {{name: string}} data
 * @private
 */
ProxySocketServer.prototype._register_server_connection = function (socket, data) {
    var socket_info = this._get_server_info(socket, data.name);
    var id = socket_info.id;

    this._io.log.info('Proxy: register server ' + id);

    this._servers[id] = socket;
    this._clients_io.clients().forEach(function (client_socket) {
        if (this.filter(client_socket, socket)) {
            client_socket.emit('new server', socket_info);
        }
    }.bind(this));

    socket.on('disconnect', this._disconnect_servers.bind(this, [id]));
    socket.on('data', this._send_to_client.bind(this, socket));
};

/**
 * Returns info about server
 * @param socket
 * @param {String} [name]
 * @returns {Object} id - server name, ip - server ip
 * @private
 */
ProxySocketServer.prototype._get_server_info = function (socket, name) {
    var hs = socket.handshake;
    if (name) {
        hs.name = name;
    }
    return {
        id: hs.name,
        ip: hs.address.address
    };
};

/**
 * Get info about all connected and permitted servers
 * @param client_socket socket to return list of available servers
 * @returns {Array} Array of objects with info about servers
 * @private
 */
ProxySocketServer.prototype._get_info_about_servers = function (client_socket) {
    return this._servers_io
        .clients()
        .filter(this._filter.bind(this, client_socket))
        .map(function (socket) {
            return this._get_server_info(socket);
        }.bind(this));
};

ProxySocketServer.prototype._filter = function (client_socket, server_socket) {
    if (!server_socket.handshake.name) {
        return false;
    }
    return this.filter(client_socket, server_socket);
};

/**
 * Allows filter the connections. You can redefine this method for instances
 * @param client_socket
 * @param server_socket
 * @public
 * @returns {boolean}
 * @example Usage
 * <code>
 * proxy.filter = function(client, server){
 *   return true;
 * }
 * </code>
 */
ProxySocketServer.prototype.filter = function (client_socket, server_socket) {
    return true;
};


/**
 * Notify clients about disconnected servers
 * @param {String[]} ids id of disconnected servers
 * @private
 */
ProxySocketServer.prototype._disconnect_servers = function (ids) {
    this._clients_io.emit('servers disconnected', {
        ids: ids
    });
};

/**
 * Register client connection and send to this client info about available servers
 * @param {Socket} socket
 * @private
 */
ProxySocketServer.prototype._register_client_connection = function (socket) {

    var sess = socket.handshake.session;
    socket.log.info(
        'a socket with sessionID'
        , socket.handshake.sessionID
        , 'connected'
    );
    socket.on('set value', function (val) {
        sess.reload(function () {
            sess.value = val;
            sess.touch().save();
        });
    });
    this._io.log.info('Proxy: register client');
    socket.emit('available servers', {
        servers: this._get_info_about_servers(socket)
    });
    socket.on('data', this._send_to_server.bind(this, socket));
};


/**
 * Return ids array of connected servers
 * @return {String[]}
 * @private
 */
ProxySocketServer.prototype._get_servers_ids = function () {
    return Object.keys(this._servers);
};


/**
 * Try notify clients about application is closing
 * @private
 */
ProxySocketServer.prototype._turn_off = function () {
    this._disconnect_servers(this._get_servers_ids());
};


/**
 * Send message to server
 * @param {Socket} from_socket Socket from which data is sending
 * @param {Object} data sending data
 * @private
 */
ProxySocketServer.prototype._send_to_server = function (from_socket, data) {
    var destination_socket = this._servers[data.to];
    if (!destination_socket) {
        from_socket.emit('error', {
            message: data.to + ' does not found'
        });
        return;
    }

    if (!this.filter(from_socket, destination_socket)) {
        from_socket.emit('error', {
            message: 'Permission denied'
        });
        return;
    }

    delete data.to;
    data.from = from_socket.id;
    destination_socket.emit('data', data);
};


/**
 * Send message to client
 * @param {Socket} from_socket Socket from which data is sending
 * @param {Object} data sending data
 * @private
 */
ProxySocketServer.prototype._send_to_client = function (from_socket, data) {
    var destination = this._clients_io.sockets[data.to];
    if (!destination) {
        from_socket.emit('error', {
            message: data.to + ' does not found'
        });
        return;
    }

    var server_info = this._get_server_info(from_socket);
    delete data.to;
    data.from = server_info.id;
    destination.emit('data', data);
};


module.exports = ProxySocketServer;