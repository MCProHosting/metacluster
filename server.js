var net    = require('net'),
    pool   = require('./pool'),
    parser = require('./parser'),
    config = require('./config');

var Pool = new pool(config.servers);

function Client (socket) {
    var self   = this,
        spool  = '';

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

        socket.on('data',function (data) {
            spool += data.toString('utf8');
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
            var index = spool.indexOf(parser.delimiter);
            if (index === -1) {
                break;
            }

            var query      = spool.slice(0, index),
                dataLength = parser.wantsData(query),
                terminus   = index + parser.delimiter.length + dataLength;

            if (spool.length < terminus) {
                break;
            }

            commands.push(query + spool.slice(index, terminus));
            spool = spool.slice(terminus).trim();
        }

        return commands;
    }
}

module.exports = function () {
    return net.createServer(function (socket) {
        (new Client(socket)).boot();
    });
};
