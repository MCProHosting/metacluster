var common = require('./common');

function RedisError(buf) {
    _.extend(this, common.processSimple(buf));
}

module.exports = RedisError;
