var Parser = require('./parser');

module.exports = function (buf, limit) {
    if (!Buffer.isBuffer(buf)) {
        buf = new Buffer(buf);
    }

    return new Parser(buf, limit);
};
