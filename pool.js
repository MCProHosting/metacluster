var record = require('./record'),
    log    = require('./log'),
    parser = require('./parser'),
    _      = require('lodash');

function Pool(servers) {
    var self = this;
    self.servers = [];

    for (var i = 0, l = servers.length; i < l; i++) {
        var server = servers[i];
        self.servers.push(new record(server.port, server.host, server.local));
    }

    /**
     * Runs the given command on appropriate servers. The callback will be
     * triggered with data from the first valid response given by any
     * server the command is executed on.
     *
     * Reads will be executed on a single cluster, local if possible.
     * Writes will be run on all listed servers.
     *
     * @param {string} query
     * @param {function} callback
     */
    self.run = function (query, callback) {
        if (parser.isWrite(query)) {
            for (var i = 0, l = self.servers.length; i < l; i++) {
                var hasGivenCallback = false;
                runOn(self.servers[i], query, function (data) {
                    if (!hasGivenCallback) {
                        callback(data);
                        hasGivenCallback = true;
                    }
                });
            }
        }

        var available = _.where(self.servers, {status: 'online'}),
            locals = _.where(available, {local: true});

        if (available.length === 0) {
            // No need to log, we'll already have logged that they're down!
            callback('ERROR');
        }

        runOn(_.sample(locals.length ? locals : available), query, callback)
    };

    /**
     * Runs a command on the given server.
     *
     * @param {memcached.client} server
     * @param {string} query
     * @param {function} callback
     */
    function runOn(server, query, callback) {
        server.write(query, function (data) {
            callback(data);
        });
    }
}

module.exports = Pool;
