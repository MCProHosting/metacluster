var parse = require('../lib/parse');

describe('Redis command parser', function () {
    it('parses simple strings', function () {
        var str = '+OK\r\n';
        var out = parse(str);

        expect(out.isValid).toBe(true);
        expect(out.items.length).toBe(1);
        expect(out.items[0].isComplete).toBe(true);
        expect(out.items[0].length).toBe(5);
        expect(out.items[0].data.toString()).toBe(str);
    });

    it('parses errors', function () {
        var str = '-WRONGTYPE Operation against a key holding the wrong kind of value\r\n';
        var out = parse(str);

        expect(out.isValid).toBe(true);
        expect(out.items.length).toBe(1);
        expect(out.items[0].isComplete).toBe(true);
        expect(out.items[0].length).toBe(68);
        expect(out.items[0].data.toString()).toBe(str);
    });

    it('parses integers', function () {
        var str = ':1000\r\n';
        var out = parse(str);

        expect(out.isValid).toBe(true);
        expect(out.items.length).toBe(1);
        expect(out.items[0].isComplete).toBe(true);
        expect(out.items[0].length).toBe(7);
        expect(out.items[0].data.toString()).toBe(str);
    });

    it('parses bulk strings', function () {
        var str = '$6\r\nfoobar\r\n';
        var out = parse(str);

        expect(out.isValid).toBe(true);
        expect(out.items.length).toBe(1);
        expect(out.items[0].isComplete).toBe(true);
        expect(out.items[0].length).toBe(12);
        expect(out.items[0].data.toString()).toBe(str);
    });

    it('parses arrays', function () {
        var str = '*2\r\n' +
            ':42\r\n' +
            '$6\r\n' +
            'foobar\r\n';
        var out = parse(str);

        expect(out.isValid).toBe(true);
        expect(out.items.length).toBe(1);
        expect(out.items[0].isComplete).toBe(true);
        expect(out.items[0].length).toBe(21);
        expect(out.items[0].data.toString()).toBe(str);
    });

    it('parses multiple types', function () {
        var str = '*1\r\n' +
            ':42\r\n' +
            '$6\r\n' +
            'foobar\r\n';
        var out = parse(str);

        expect(out.isValid).toBe(true);
        expect(out.items.length).toBe(2);

        expect(out.items[0].isComplete).toBe(true);
        expect(out.items[0].length).toBe(9);
        expect(out.items[0].data.toString()).toBe('*1\r\n:42\r\n');

        expect(out.items[1].isComplete).toBe(true);
        expect(out.items[1].length).toBe(12);
        expect(out.items[1].data.toString()).toBe('$6\r\nfoobar\r\n');
    });

    it('doesnt fail on stupid data', function () {
        expect(parse('lala:42\r\n').isValid).toBe(false);
        expect(parse('$foo\r\nsdfdsfsdf').items.length).toBe(0);
    });

    it('handles null bytes in bulk strings', function () {
        var str = '$-1\r\n';
        var out = parse(str);

        expect(out.isValid).toBe(true);
        expect(out.items.length).toBe(1);
        expect(out.items[0].isComplete).toBe(true);
        expect(out.items[0].length).toBe(5);
        expect(out.items[0].data.toString()).toBe(str);
    });

    it('handles null bytes in arrays', function () {
        var str = '*-1\r\n';
        var out = parse(str);

        expect(out.isValid).toBe(true);
        expect(out.items.length).toBe(1);
        expect(out.items[0].isComplete).toBe(true);
        expect(out.items[0].length).toBe(5);
        expect(out.items[0].data.toString()).toBe(str);
    });
});