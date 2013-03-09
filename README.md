sockets_proxy
=============

Installation
------------

1. Install git and node
2. Clone the repo and install dependencies

    ```bash
    $ git clone git://github.com/jifeon/sockets_proxy.git
    $ cd sockets_proxy
    $ npm install .
    ```
3. Install [forever](https://github.com/nodejitsu/forever) globally

    ```bash
    $ sudo npm install -g forever
    ```

Usage
-----

### Write some code

File structure:
```
/your_project
  /index.js
  /node_modules
    /sockets_proxy <- clone repo here
```
File index.js:
```js
var ProxyServer = require('sockets_proxy');
new ProxyServer();
```

### Run the application

For debug
```bash
$ node index.js
```

On production
```bash
$ forever start index.js
```

To stop application
```bash
$ forever list
> info:    Forever processes running
> data:        uid  command             script   forever pid  logfile                        uptime      
> data:    [0] L7wG /usr/local/bin/node index.js 4156    4196 /home/jifeon/.forever/L7wG.log 0:0:0:0.160
$ forever stop 0
```

Configuring
-----------

You can specify some options for ProxyServer.

### port
_default:_ `80`

The server will listen that port

### io_options
_default:_ `{}`

[Options for Socket.IO](https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO)

### Example

```js
var ProxyServer = require('sockets_proxy');
new ProxyServer({
    port: 3000,
    io_options{
        'flash policy port': 843
    }
});
```

Connecting servers
------------------

To connect remote server just open WS connection using [Socket.IO library](http://socket.io) to adress 
http://your.server.com:3000/as_server

After server is connected emit event "register" to set the name for server.

All events:

### "connect"

Your server connected to proxy server

### "register"

Use to set name for server. Before you register a server, it would not be able to clients.

```js
socket.on('connect', function () {
  log('socket connected');
  socket.emit('register', {
    name: "RS1"
  });
});
```

### "error"

_Arguments:_ `{Error} error`

An error ocurred during connection

### "data"

_Arguments:_ `{Object} data`

Event rising up when data from client is recieved. You can get id of client from `data.from`. You also can use this 
event to send data to client. You should specify `data.to` in this case.

Example for javascript:
```js
socket.on('data', function (data) {
  log('Message received: "' + data.text + '" from ' + data.from + '. Send it back');
  
  var callbackData = {
      to: data.from
      text: 'message received'
  };
  socket.emit('data', callbackData);
});
```

Connecting clients
------------------

To connect client to proxy open WS connection using [Socket.IO library](http://socket.io) to adress 
http://your.server.com:3000/as_client

After that start listen follow events of socket object:

### "connect"

Client connected to proxy

### "error"

_Arguments:_ `{Error} error`

An error ocurred during connection

### "available servers"

_Arguments:_ `{Object} data`

Emited after proxy is connected. It informs about available servers connected to the proxy. It's also rising up whan proxy
server restarts. You should forget all saved servers on this event, cause they are no longer exist on proxy server. You
should replace it by received `data.ids`. 

`data.ids` is array of strings. Every string is id of remote server. You can use that ids to send a messages to remote 
server.

```js
socket.on('available servers', function (data) {
    // send messages to all available servers
    data.ids.forEach(function(id){
        socket.emit('data', {
            to: id,
            hi: "remote server"
        });
    });
});
```

### "new server"

_Arguments:_ `{Object} data`

New remote server is connected to proxy server. You can get id of that server from `data.id`

### "servers disconnected"

_Arguments:_ `{Object} data`

Emited whan one or few remote servers are disconneced from proxy server. Array `data.ids` contains identificators of that 
servers.

### "data"

_Arguments:_ `{Object} data`

Event rising up when data from remote server is recieved. You can get id of server from `data.from`. You also can use 
this event to send data to remote server. You should specify `data.to` in this case.

Example for javascript:
```js
socket.on('data', function (data) {
    console.log('Data recieved from server', data.from);
    console.log(data);
});
```

Example
-------

You can see example within a folder `example`
```
/example
    /IS.js  - proxy server runner
    /html
        /client.html    - html for client, client.js is more interesting
        /RS.html        - remote server emulator
        /scripts
            /client.js  - scripts for client
```

Filter available servers
------------------------

You can filter available servers for specific clients. It means that clients will not response info about some servers
after conection. And even if this clients would try to send messages to not availables (but existing) servers, thay 
respond an error "permission denied"

You can see full example in example/IS.js 

```js
var ProxySocketsServer = require('sockets_proxy');
var proxy = new ProxySocketsServer({
  port: 3000
});

// You can redefine this function to define permitions
proxy.filter = function (client_socket, server_socket) {
  // client_socket.handshake.query - GET params of connection
  return client_socket.handshake.query.not != server_socket.handshake.name;
};
```



