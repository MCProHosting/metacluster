var net    = require('net'),
    pool   = require('./pool'),
    parser = require('./parser'),
    config = require('./config'),
    buft   = require('buffertools');

var Pool = new pool(config.servers);

function Client (socket) {
    var self   = this,
        spool  = new Buffer(0);

    /**
     * Dispatches all commands on the spool.
     */
    self.processSpool = function () {
        getCommands().map(function (command) {
            Pool.run(command, function (result) {
                socket.write(result);
            });
        });
    };

    /**
     * Adds appropriate listeners to the socket.
     */
    self.boot = function () {
        socket.setEncoding('binary');

        socket.on('data', function (data) {
            spool = Buffer.concat([spool, new Buffer(data)]);
            self.processSpool();
        });

        socket.on('close', self.processSpool);
    };

    /**
     * Returns an array of all commands in the buffer, removing them.
     *
     * @returns {string[]}
     * @see https://github.com/memcached/memcached/blob/master/doc/protocol.txt
     */
    function getCommands () {
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

            commands.push(Buffer.concat([query, spool.slice(index, terminus)]).toString());
            spool = spool.slice(terminus);
        }
        console.log(commands);

        return commands;
    }
}

module.exports = function () {
    return net.createServer(function (socket) {
        (new Client(socket)).boot();
    });
};
