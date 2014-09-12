var common = require('./common'),
    parser = require('./index');

function RedisArray (buf) {
    var self = this,
        declaration = common.getByteDeclaration(buf),
        // So basically here we want to slice out everything after the length
        // declaration, and pass it into the parser for... parsing.
        parsed = parser(buf.slice(declaration.startingAt), declaration.length);

    self.isComplete = parsed.items.length === declaration.length;

    // Calculate the length by adding the individual lengths of every item,
    // and then the length of the byte declaration itself.
    self.length = parsed.items.reduce(function (previous, item) {
        return previous + item.length;
    }, 0) + declaration.startingAt;
}

module.exports = RedisArray;
