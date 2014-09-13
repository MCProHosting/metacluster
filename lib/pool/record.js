var connection = require('./connection'),
    config     = require('../../config'),
    _          = require('lodash');

function Record (port, host, local) {
    var self = this,
        connections = [];

    // Instantiate our connections
    while (connections.length < config.performance.connectionPool) {
        var con = new connection(port, host);
        con.on('status', pollStatus);

        connections.push(con);
    }

    /**
     * Writes a command to the least busy of the connections.
     *
     * @param {string} query
     * @param {function} callback
     */
    self.write = function (query, callback) {
        var c = _.where(connections, {status: 'online'}).sort(function (a, b) {
            return a.queue.length() - b.queue.length();
        });

        if (!c.length) {
            throw Error('We should not try to connect to nodes which are not online!');
        }

        c.shift().queue.push({query: query, callback: callback});
    };

    /**
     * Checks the status of all connections.
     */
    function pollStatus () {
        self.status = 'offline';
        for (var i = 0, l = connections.length; i < l; i++) {
            if (connections[i].status === 'online') {
                self.status = 'online';
                break;
            }
        }
    }
}

module.exports = Record;
