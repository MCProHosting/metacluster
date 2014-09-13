var common = require('./common'),
    _      = require('lodash');

function BulkString(buf) {
    var self = this,
        declaration = common.getByteDeclaration(buf);

    if (declaration === false) {
        self.isComplete = false;
    } else {
        self.isComplete = true;

        // If we have a null string, it's pretty easy to handle.
        if (declaration.length === -1) {
            self.length = declaration.startingAt;
        } else {
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
            self.isComplete = Buffer.byteLength(buf.toString()) >= self.length;
        }

        if (self.isComplete) {
            self.data = buf.slice(0, self.length);
        }
    }

    /**
     * Returns whether this bulk string is an given command
     *
     * @param  {String}  command
     * @return {Boolean}
     */
    self.is = function (command) {
        var data = self.data.slice(declaration.startingAt).toString();

        return data.slice(0, command.length) === command;
    };

    /**
     * Returns whether this command is a "write" command which affects other
     * connections.
     *
     * @return {Boolean}
     */
    self.isWrite = function () {

        return ! _.any(['BITPOS', 'CLIENT LIST', 'CLIENT GETNAME',
            'CLUSTER SLOTS', 'COMMAND', 'COMMAND COUNT', 'COMMAND GETKEYS',
            'COMMAND INFO', 'CONFIG GET', 'DBSIZE', 'DEBUG OBJECT', 'DUMP',
            'ECHO', 'EXISTS', 'GET', 'GETBIT', 'GETRANGE', 'HEXISTS', 'HGET',
            'HGETALL', 'HKEYS', 'HLEN', 'HMGET', 'HVALS', 'INFO', 'KEYS',
            'LASTSAVE', 'LLEN', 'LRANGE', 'MGET', 'MONITOR', 'PFCOUNT', 'PING',
            'PSUBSCRIBE', 'PUBSUB', 'PTTL', 'RANDOMKEY', 'ROLE', 'SCARD',
            'SCRIPT EXISTS', 'SINTER', 'SISMEMBER', 'SMEMBERS', 'SRANDMEMBER',
            'STRLEN', 'SUNION', 'TIME', 'TTL', 'TYPE', 'ZCARD', 'ZCOUNT',
            'ZLEXCOUNT', 'ZRANGE', 'ZRANGEBYLEX', 'ZRANGEBYSCORE', 'ZRANK',
            'ZSCORE', 'SCAN', 'SSCAN', 'HSCAN', 'ZSCAN'], self.is
        );
    };
}

module.exports = BulkString;
