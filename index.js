var config = require('./config'),
    server = require('./server');

server().listen(config.http.port, config.http.host);
