var buft = require('buffertools');

// Delimited between redis data blocks. This should never change... but I
// hate hardcoding things everywhere.
var delimiter = '\r\n';

/**
 * Process out a simple, delimited string from the buffer.
 *
 * @param {Buffer} buffer
 * @returns {{isComplete: boolean, length: number, data: {Buffer}}}
 */
function processSimple(buffer) {
    var index = buft.indexOf(buffer, delimiter);

    return {
        isComplete: index !== -1,
        length: index + delimiter.length,
        data: buffer.slice(0, index + delimiter.length)
    };
}

/**
 * Returns the number of bytes declared for array and bulk string types.
 * @param {Buffer} buffer
 * @returns {{length: number, startingAt: number}}
 */
function getByteDeclaration(buffer) {
    // First, try to find the position right before the first delimiter.
    // this will be the body data length.
    var byteDelimiter = buft.indexOf(buffer, delimiter);

    // If it's less than zero, this command is not complete!
    if (byteDelimiter < 0) {
        return false;
    }

    // Now, take splice out the delimiter and try to parse it.
    var lengthString = buffer.slice(1, byteDelimiter),
        bodyLength = parseInt(lengthString, 10);

    if (isNaN(bodyLength)) {
        return false;
    }

    return {
        length: bodyLength,
        startingAt: byteDelimiter + delimiter.length
    };
}

module.exports = {
    delimiter: delimiter,
    processSimple: processSimple,
    getByteDeclaration: getByteDeclaration
};
