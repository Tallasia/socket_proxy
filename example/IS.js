var ProxySocketsServer = require('../lib/proxy_socket_server.js');
var proxy = new ProxySocketsServer({
  port: 3000
});

proxy.filter = function (client_socket, server_socket) {
  return client_socket.handshake.query.not != server_socket.handshake.query.name;
};