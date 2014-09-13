var log     = require('../log'),
    config  = require('../../config'),
    parse   = require('../parse'),
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
        console.log('========================');
        console.log('Querying:');
        console.log(query.query.data.toString());
        self.client.write(query.query.data);

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
            self.error = 'Connection closed.';
            self.emit('status', 'offline');
        });

        self.client.on('timeout', function () {
            self.error = 'Connection timed out.';
            self.emit('status', 'offline');
        });

        self.client.on('error', function (e) {
            self.error = 'Connection error ' + e;
            self.emit('status', 'offline');
        });

        self.client.on('end', function (e) {
            self.error = 'Connection ended.';
            self.emit('status', 'offline');
        });

        self.client.on('data', function (data) {
            spool = Buffer.concat([spool, data]);
            console.log('Chunk: ' + spool.toString());
            var parsed = parse(spool);

            if (parsed.items.length) {
                console.log('Writing');
                parsed.forEach(function (item) {
                    self.emit('chunk', item.data.toString());
                });
                spool = spool.slice(parsed.length);
            }
        });
    }

    self.on('status', function (status) {
        self.status = status;

        if (status === 'offline') {
            log.warn(addrString + ' went offline with error ' + self.error);
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
