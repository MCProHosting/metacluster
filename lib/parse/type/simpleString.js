var common = require('./common'),
    _      = require('lodash');

function SimpleString(buf) {
    _.extend(this, common.processSimple(buf));
}

module.exports = SimpleString;
