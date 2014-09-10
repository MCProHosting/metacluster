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
            callWriteQuery(query, callback);
        } else {
            callReadQuery(query, callback);
        }
    };

    /**
     * Executes a write query on all clusters.
     *
     * @param  {string}   query
     * @param  {Function} callback
     * @return {void}
     */
    function callWriteQuery(query, callback) {
        for (var i = 0, l = self.servers.length; i < l; i++) {
            var hasGivenCallback = false;
            self.servers[i].write(query, function (data) {
                if (!hasGivenCallback) {
                    callback(data);
                    hasGivenCallback = true;
                }
            });
        }
    }

    /**
     * Selects a server and runs a read type query on it.
     *
     * @param  {string}   query
     * @param  {Function} callback
     * @return {void}
     */
    function callReadQuery(query, callback) {
        var available = _.where(self.servers, {status: 'online'}),
            locals = _.where(available, {local: true});

        if (available.length === 0) {
            // No need to log, we'll already have logged that they're down!
            return _.defer(function () {
                callback('ERROR');
            });
        }

        _.sample(locals.length ? locals : available).write(query, callback);
    }
}

module.exports = Pool;
