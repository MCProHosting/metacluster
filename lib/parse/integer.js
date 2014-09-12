var common = require('./common');

function Integer(buf) {
    _.extend(this, common.processSimple(buf));
}

module.exports = Integer;
