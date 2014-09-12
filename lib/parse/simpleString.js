var common = require('./common');

function SimpleString(buf) {
    _.extend(this, common.processSimple(buf));
}

module.exports = SimpleString;
