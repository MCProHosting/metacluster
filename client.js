var net     = require('net'),
    util    = require('util'),
    emitter = require('events').EventEmitter;

/**
 * Memcached client. Inspired by this, but much more raw:
 * https://github.com/elbart/node-memcache/blob/master/lib/memcache.js
 */
function Client (port, host) {
    var self = this;

    self.connection = null;

    self.connect = function () {
        self.connection = net.createConnection(port, host);

        self.connection.addListener("connect", function () {
            self.emit("connect");
            self.dispatchHandles();
        });

        self.connection.addListener("data", function (data) {
            self.emit('data')
        });

        self.connection.addListener("end", function () {
            if (self.conn && self.conn.readyState) {
                self.conn.end();
                self.conn = null;
            }
        });

        self.connection.addListener("close", function () {
            self.emit("close");
        });

        self.connection.addListener("timeout", function () {
            self.emit("timeout");
        });

        self.connection.addListener("error", function (ex) {
            self.emit("error", ex);
        });
    }
}

util.inherits(Client, emitter);

module.exports = Client;
