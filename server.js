var net    = require('net'),
    pool   = require('./pool'),
    parser = require('./parser'),
    config = require('./config'),
    async  = require('async'),
    buft   = require('buffertools');

var Pool = new pool(config.servers);

function Client (socket) {
    var self   = this,
        isOpen = true,
        spool  = new Buffer(0);

    var queue = async.queue(function (command, callback) {
        Pool.run(command, function (result) {
            if (isOpen) {
                socket.write(result);
            }
            callback();
        });
    });

    /**
     * Adds appropriate listeners to the socket.
     */
    self.boot = function () {
        socket.setEncoding('utf8');

        socket.on('data', function (data) {
            spool = Buffer.concat([spool, new Buffer(data)]);
            pushCommands();
        });

        socket.on('close', function () {
            isOpen = false;
            pushCommands();
        });
    };

    /**
     * Parses commands out of the spool buffer and send them to the async queue.
     *
     * @returns {string[]}
     * @see https://github.com/memcached/memcached/blob/master/doc/protocol.txt
     */
    function pushCommands () {
        var commands = [];
        
        while (true) {
            var index = buft.indexOf(spool, parser.delimiter);
            if (index === -1) {
                break;
            }
            if (index === 0) {
                spool = spool.slice(parser.delimiter.length);
                continue;
            }

            var query      = spool.slice(0, index),
                dataLength = parser.wantsData(query.toString()),
                terminus   = index + parser.delimiter.length + dataLength;

            if (parser.len(spool.toString()) < terminus) {
                break;
            }

            queue.push(Buffer.concat([query, spool.slice(index, terminus)]).toString());
            spool = spool.slice(terminus);
        }

        return commands;
    }
}

module.exports = function () {
    return net.createServer(function (socket) {
        (new Client(socket)).boot();
    });
};
