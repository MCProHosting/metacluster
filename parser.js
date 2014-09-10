var _ = require('lodash');

var delimiter = '\r\n';

/**
 * Returns whether the given action can modify data.
 *
 * @param {string} query
 * @returns {boolean}
 */
function isWrite(query) {
    return !_.some(['get', 'stats', 'version', 'cas'], function (action) {
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

/**
 * Gets the index of the first end position of the data.
 * @param data
 * @returns {number}
 */
function endIndex(data) {
    var endBlocks = [
        'END', 'STORED', 'NOT_STORED', 'EXISTS', 'NOT_FOUND', 'DELETED', 'NOT_FOUND',
        'TOUCHED', 'OK', 'BUSY', 'BADCLASS', 'NOSPARE', 'NOTFULL', 'UNSAFE', 'SAME',
        'ERROR', 'CLIENT_ERROR', 'SERVER_ERROR'
    ], firstIndex = -1;

    for (var i = 0, l = endBlocks.length; i < l; i++) {
        var index = data.indexOf(endBlocks[i]);

        if (index !== -1) {
            firstIndex = firstIndex === -1 ? index : Math.min(index, firstIndex);
        }
    }

    return data.indexOf(delimiter, firstIndex) + delimiter.length;
}

module.exports = {
    isWrite: isWrite,
    wantsData: wantsData,
    endIndex: endIndex,
    delimiter: delimiter
};
