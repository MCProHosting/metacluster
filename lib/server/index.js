var net    = require('net'),
    config = require('../../config'),
    pool   = require('../pool'),
    parse  = require('../parse'),
    common = require('../parse/type/common'),
    async  = require('async');

var Pool = new pool(config.servers);

function Client (socket) {
    var self   = this,
        isOpen = true,
        spool  = new Buffer(0);

    // Create a queue object to run commands in the pool. We can only have a
    // single "job" running at once per connection.
    var queue = async.queue(function (command, callback) {
        if (command.pluck('quit').length) {
            socket.end('+OK' + common.delimiter);
        }

        if (!command.hasItems) {
            return callback();
        }

        Pool.run(command, function (result) {
            if (isOpen) {
                socket.write(result);
            }
            callback();
        });
    }, 1);

    /**
     * Adds appropriate listeners to the socket.
     */
    self.boot = function () {
        socket.setEncoding('utf8');

        socket.on('data', function (data) {
            spool = Buffer.concat([spool, new Buffer(data)]);
            processCommands();
        });

        socket.on('close', function () {
            isOpen = false;
            processCommands();
        });
    };

    /**
     * Parses commands out of the spool buffer and
     * send them to the async queue.
     */
    function processCommands () {
        var parser = parse(spool);

        parser.forEach(queue.push);

        spool = spool.slice(parser.length);
    }
}

module.exports = function () {
    return net.createServer(function (socket) {
        (new Client(socket)).boot();
    });
};
