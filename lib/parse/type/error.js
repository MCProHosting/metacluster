var common = require('./common'),
    _      = require('lodash');

function RedisError(buf) {
    _.extend(this, common.processSimple(buf));
}

module.exports = RedisError;
