var common = require('./common');

function BulkString(buf) {
    var self = this,
        declaration = common.getByteDeclaration(buf);

    if (declaration === false) {
        self.isComplete = false;
    } else {
        self.isComplete = true;

        // Set the command length, in bytes. It is the body length, plus the
        // delimiter we already parsed out. The delimiter after the length
        // (which we subtracted before) and the delimiter at the end of the
        // block are added.
        self.length = declaration.length + declaration.startingAt +
            common.delimiter.length;

        // See if we have all the data! We have to play around here. Buf.length
        // returns the memory allocated for the buffer, but that can be greater
        // than the buffer's content's size. So, convert it to a utf-8 string
        // and measure the string's length in bytes.
        self.isComplete = Buffer.byteLength(buf.toString());
    }
}

module.exports = BulkString;