var _    = require('lodash'),
    buft = require('buffertools');

var delimiter = '\r\n';

/**
 * Returns whether the given action can modify data.
 *
 * @param {string} query
 * @returns {boolean}
 */
function isWrite(query) {
    return !_.some(['get', 'stats', 'version'], function (action) {
        return query.indexOf(action) === 0;
    });
}

/**
 * Returns whether the given action wants a "block" of data
 *
 * @param {string} query
 * @returns {boolean}
 */
function getsData(query) {
    return _.some(['set', 'add', 'replace', 'ammend', 'prepend', 'cas'], function (action) {
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
    if (!getsData(query)) {
        return 0;
    }

    return parseInt(query.split(' ')[4], 10);
}

/**
 * Calculates the length, in bytes, of the string. We can't just use str.length,
 * because each one utf character is actually two bytes, and it will fail.
 *  
 * @param  {string} str
 * @return {number}
 */
function len(str) {
    return Buffer.byteLength(str);
}

/**
 * Gets the index of the first end position of the data.
 * @param {Buffer} data
 * @returns {number}
 */
function endIndex(data) {
    var endBlocks = [
        'END', 'STORED', 'NOT_STORED', 'EXISTS', 'NOT_FOUND', 'DELETED', 'NOT_FOUND',
        'TOUCHED', 'OK', 'BUSY', 'BADCLASS', 'NOSPARE', 'NOTFULL', 'UNSAFE', 'SAME',
        'ERROR', 'CLIENT_ERROR', 'SERVER_ERROR', 'VERSION'
    ], firstIndex = -1;

    for (var i = 0, l = endBlocks.length; i < l; i++) {
        var index = buft.indexOf(data, endBlocks[i]);

        if (index !== -1) {
            firstIndex = firstIndex === -1 ? index : Math.min(index, firstIndex);
        }
    }

    return buft.indexOf(data, delimiter, firstIndex) + delimiter.length;
}

module.exports = {
    isWrite: isWrite,
    wantsData: wantsData,
    endIndex: endIndex,
    len: len,
    delimiter: delimiter
};
