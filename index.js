var config = require('./config'),
    server = require('./lib/server');

server().listen(config.http.port, config.http.host);
