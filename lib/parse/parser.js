var _ = require('lodash');

// List of Redis control characters to their class representations.
var controls = {
    '+': require('./type/simpleString'),
    '-': require('./type/error'),
    ':': require('./type/integer'),
    '$': require('./type/bulkString'),
    '*': require('./type/array')
};

/**
 * Object which handles parsing of a buffer. Assumes that the first
 * byte of the buffer is the data type definition.
 *
 * @param {Buffer} buf
 * @param {Number} limit
 * @constructor
 */
function Parsed(buf, limit) {
    var self = this;

    // Whether we were able to parse the buffer successfully, or not.
    self.isValid = true;
    // An array of item contained in the buffer;
    self.items = [];

    // Add some utility functions from lodash for operating on the items.
    self.forEach = function () {
        [].unshift.call(arguments, self.items);
        _.forEach.apply(self, arguments);
    };

    self.where = function () {
        [].unshift.call(arguments, self.items);
        _.where.apply(self, arguments);
    };

    // Now, we'll try parsing out the buffer into correct commands,
    // so long as we still have data and are below any limit given.
    for (var i = 0; buf.length && (!limit || i < limit); i++) {
        // Get the control character. Error if we don't find it
        // in the first byte.
        var type = controls[buf.toString()[0]];
        if (typeof type === 'undefined') {
            self.isValid = false;
            break;
        }

        // Instantiate the type, add it to the items list, and remove
        // its data from our lovely buffer, iff it's complete.
        var item = new type(buf);

        if (item.isComplete) {
            // If the item is complete, then slice its data out of our "spool"
            // and push its object representation.
            buf = buf.slice(item.length);
            self.items.push(item);
        } else {
            // If we aren't complete, we should have reached the end of the
            // useful buffer data!
            buf = new Buffer(0);
        }
    }

    // Calculate the length by adding the individual lengths of every item.
    self.length = self.items.reduce(function (previous, item) {
        return previous + item.length;
    }, 0);
}

module.exports = Parsed;