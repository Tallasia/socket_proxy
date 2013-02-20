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
  index.js
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
_default:_ ```80```

The server will listen that port

### io_options
_default:_ ```{}```

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

To connect server 









