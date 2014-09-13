var common = require('./common'),
    _      = require('lodash');

function RedisArray (buf) {
    var self        = this,
        declaration = common.getByteDeclaration(buf),
        isNull      = false;

    self.items = [];


    if (declaration.length < 1) {
        isNull = true;
        self.length = declaration.startingAt;
        self.isComplete = true;
    } else {
        // We have to require the parser here to
        // prevent circular dependency silliness
        var Parser = require('../parser'),
            // So basically here we want to slice out everything after the length
            // declaration, and pass it into the parser for... parsing.
            parsed = new Parser(buf.slice(declaration.startingAt), declaration.length);

        self.isComplete = parsed.items.length === declaration.length;

        // Calculate the length by adding the parsed
        // data length to the declation.
        self.length = parsed.length + declaration.startingAt;

        self.items = parsed.items;
    }

    function updateData() {
        if (isNull) {
            self.data = constructLen(declaration.length);
            return;
        }

        self.data = Buffer.concat(_.pluck(self.items, 'data'));
        self.data = Buffer.concat([
            constructLen(self.items.length),
            self.data
        ]);

        self.hasItems = self.items.length > 0;
    }

    function constructLen(length) {
        return new Buffer('*' + length + common.delimiter);
    }

    updateData();

    /**
     * Returns a list of write commands that we have.
     *
     * @return {Array}
     */
    self.getWrites = function () {
        return _.where(self.items, function (el) {
            return typeof el.isWrite !== 'undefined' && el.isWrite();
        });
    };

    /**
     * Returns a list of read commands that we have.
     *
     * @return {Array}
     */
    self.getReads = function () {
        return _.where(self.items, function (el) {
            return typeof el.isWrite === 'undefined' || !el.isWrite();
        });
    };

    /**
     * Removes and returns an command from the array.
     * @param  {String}  command
     * @return {Boolean}
     */
    self.pluck = function (command) {
        var out = _.where(self.items, function (el) {
            return typeof el.is !== 'undefined' && el.is(command);
        });

        self.items = _.reject(self.items, function (el) {
            return typeof el.is !== 'undefined' && el.is(command);
        });

        updateData();

        return out;
    };
}

module.exports = RedisArray;
