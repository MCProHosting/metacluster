var log     = require('./log'),
    config  = require('./config'),
    parser  = require('./parser'),
    emitter = require('events').EventEmitter,
    util    = require('util'),
    net     = require('net'),
    async   = require('async'),
    _       = require('lodash');

function Connection (port, host) {
    var self       = this,
        spool      = new Buffer(0),
        addrString = host + ':' + port,
        abortAfter = config.performance.failRetries;

    self.attempts = 0;

    self.queue = async.queue(function (query, callback) {
        console.log('sending: ' + query.query.trim());
        self.client.write(query.query.trim() + parser.delimiter);
        
        self.on('chunk', function (data) {
            query.callback(data);
            self.removeAllListeners('chunk');

            callback();
        });
    }, 1);

    // Debounce this to prevent filcker/proxy oddness
    var isConnected = _.debounce(function () {
        if (self.status !== 'offline') {
            self.emit('status', 'online');
        }
    }, 5000);

    /**
     * Attempts to connect to the server. Fails if we're passed the max
     * number of attempts, and sets a delay exponentially to the past
     * number of failed attempts.
     */
    self.connect = function () {
        var delay = Math.pow(self.attempts++, 2);

        if (self.error) {
            log.info('Unable to connect to ' + addrString + ', ' + self.error + ', retrying in ' + delay + 's');
        }

        if (self.attempts < abortAfter) {
            return setTimeout(startClient, delay * 1000);
        }

        log.error('Unable to connect to ' + addrString + ', aborted after '
            + abortAfter + ' attempts with error' + self.error);
    };

    /**
     * Tries to connect to this record's server, binding all
     * socket events.
     */
    function startClient() {
        self.client = net.createConnection(port, host);

        self.client.on('connect', function () {
            self.emit('status', 'establishing');
            isConnected();
        });

        self.client.on('close', function () {
            self.emit('status', 'offline');
            self.error = 'Connection closed.';
        });

        self.client.on('timeout', function () {
            self.emit('status', 'offline');
            self.error = 'Connection timed out.';
        });

        self.client.on('error', function (e) {
            self.emit('status', 'offline');
            self.error = 'Connection error ' + e;
        });

        self.client.on('end', function (e) {
            self.emit('status', 'offline');
            self.error = 'Connection ended.';
        });

        self.client.on('data', function (data) {
            spool = Buffer.concat([spool, data]);
            console.log('DATA:' + spool.toString());
            var pos = parser.endIndex(spool);

            if (pos !== -1) {
                var str = spool.slice(0, pos).toString();
                self.emit('chunk', str);
                spool = spool.slice(pos);
            }
        });
    }

    self.on('status', function (status) {
        self.status = status;

        if (status === 'offline') {
            self.connect();
        } else if (status === 'online') {
            log.info('Connected to ' + addrString);
            self.error = null;
            self.attempts = 0;
        }
    });

    self.connect();
}

util.inherits(Connection, emitter);

module.exports = Connection;
