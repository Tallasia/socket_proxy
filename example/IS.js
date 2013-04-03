var express = require('express'),
    MongoStore = require('connect-mongo')(express),
    ProxySocketsServer = require('../lib/proxy_socket_server.js');
var app = express.createServer();
app.listen(3001);
var sessionOptions = {
    key: 'connect.sid',
    secret: 'secret123',
    store: new MongoStore({
        db: 'socketsSessions'
    })
};
var proxy = new ProxySocketsServer({
    port: 3000,
    sessionOptions: sessionOptions
});
var passport= require('passport'),
    DummyStrategy = require('passport-dummy').Strategy;
//Configuration
passport.serializeUser(function(username, done) {
    done(null, username);
});

passport.deserializeUser(function(username, done) {
    done(null, username);
});

var getAllowedServersByUsername = function(name){
    if (name === 'dummy') {
        return ['s1']
    } else {
        return ['s2']
    }
}
passport.use(new DummyStrategy(
    function(done) {
        return done(null, {username: 'dummy', servers: getAllowedServersByUsername('dummy')});
    }
));

app.configure(function(){
    app.use(express.static(__dirname + '/public'));
    app.set('views', __dirname + '/views');
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session(sessionOptions));
    app.use(express.methodOverride());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
});
app.configure('production', function() {
    app.use(express.logger());
    app.use(express.errorHandler());
});

app.configure('development', function() {
    app.use(express.logger());
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});

// ROUTING

app.get('/', function(req,res) {
    res.render('index.jade',{
        user: req.user || {},
        out: JSON.stringify(req.session, null, 2)
    });

});

app.get('/rs', function(req,res) {
    res.render('rs.jade');
});

app.get('/as_client', function(req,res) {
    res.render('client.jade');
});

app.post('/login',
    passport.authenticate('dummy', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    });

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

proxy.filter = function (client_socket, server_socket) {
    console.log('\n\n\n--client hs', client_socket.handshake.session.passport)
    return client_socket.handshake.query.not != server_socket.handshake.name;
};
