var log     = require('./log'),
    parser  = require('./parser'),
    emitter = require('events').EventEmitter,
    util    = require('util'),
    net     = require('net'),
    async   = require('async'),
    _       = require('lodash');

function MemcachedRecord (port, host, local) {
    var self       = this,
        spool      = '',
        addrString = host + ':' + port;

    self.attempts = 0;
    self.abortAfter = 30;
    self.local = !! local;

    // Debounce this to prevent filcker/proxy oddness
    var isConnected = _.debounce(function () {
        if (self.status !== 'offline') {
            log.info('Connected to ' + addrString);
            self.status = 'online';
            self.error = null;
            self.attempts = 0;
        }
    }, 5000);

    // Queue to process commands in series.
    var queue = async.queue(function (query, callback) {
        self.client.write(query.trim() + parser.delimiter);

        self.on('chunk', function (data) {
            callback(data);
            self.removeAllListeners('chunk');
        });
    }, 1);

    /**
     * Writes a command out to the connection, and calls
     * back with the output.
     *
     * @param {string} query
     * @param {function} callback
     */
    self.write = function (query, callback) {
        queue.push(query, callback);
    };

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

        if (self.attempts < self.abortAfter) {
            return setTimeout(startClient, delay * 1000)
        }

        log.error('Unable to connect to ' + addrString + ', aborted after '
            + self.abortAfter + ' attempts with error' + self.error);
    };

    /**
     * Tries to connect to this record's server, binding all
     * socket events.
     */
    function startClient() {
        self.client = net.createConnection(port, host);

        self.client.on('connect', function () {
            self.status = 'establishing';
            isConnected();
        });

        self.client.on('close', function () {
            self.status = 'offline';
            self.error = 'Connection closed.';
            self.connect();
        });

        self.client.on('timeout', function () {
            self.status = 'offline';
            self.error = 'Connection timed out.';
            self.connect();
        });

        self.client.on('error', function (e) {
            self.status = 'offline';
            self.error = 'Connection error ' + e;
            self.connect();
        });

        self.client.on('data', function (data) {
            spool += data.toString('utf8');
            var pos = parser.endIndex(spool);

            if (pos !== -1) {
                self.emit('chunk', spool.slice(0, pos));
                spool = spool.slice(pos);
            }
        });
    }

    self.connect();
}

util.inherits(MemcachedRecord, emitter);

module.exports = MemcachedRecord;
