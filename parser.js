var _ = require('lodash');

var delimiter = '\r\n';

/**
 * Returns whether the given action can modify data.
 *
 * @param {string} query
 * @returns {boolean}
 */
function isWrite(query) {
    return ! _.some(['get', 'stats', 'version', 'cas'], function (action) {
        return query.indexOf(action) === 0;
    });
}

/**
 * Returns the length of data the query desires.
 *
 * @see https://github.com/memcached/memcached/blob/master/doc/protocol.txt
 * @param {string} query
 * @returns {number}
 */
function wantsData(query) {
    if (!isWrite(query)) {
        return 0;
    }

    return parseInt(query.split(' ')[4], 10);
}

module.exports = {
    isWrite: isWrite,
    wantsData: wantsData,
    delimiter: delimiter
};
