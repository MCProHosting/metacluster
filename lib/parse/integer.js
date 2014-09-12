var common = require('./common'),
    _      = require('lodash');

function Integer(buf) {
    _.extend(this, common.processSimple(buf));
}

module.exports = Integer;
