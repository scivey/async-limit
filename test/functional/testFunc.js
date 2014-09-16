var sinon = require('sinon');
var _ = require('lodash');
var assert = require('../common').assert;

var asyncLimit = require('../../index');

describe('async-limit -- functional tests', function() {
    var box, delay, asyncAdd;
    beforeEach(function() {
        box = sinon.sandbox.create();
        delay = box.stub(_, 'delay');
        asyncAdd = function(x, y, callback) {
            delay(function() {
                callback(null, x + y)
            }, 50);
        };
    });
    describe('limiting', function() {
        var limited, state;
        beforeEach(function() {
            limited = asyncLimit(asyncAdd, 2);
            state = asyncLimit._internals.state;
        });
        it('works', function(done) {
            var results = [];
            limited(5, 5, function(err, res) {
                results.push(res);
            });
            limited(1, 3, function(err, res) {
                results.push(res);
            });
            limited(50, 40, function(err, res) {
                results.push(res);
            });
            limited(13, 7, function(err, res) {
                results.push(res);
            });
            limited(40, 10, function(err, res) {
                results.push(res);
            });
            assert.calledTwice(delay);
            assert.equal(0, results.length);
            delay.getCall(0).args[0]();
            assert.callCount(delay, 3);
            assert.deepEqual([10], results);
            _.defer(function() {
                assert.callCount(delay, 3);
                assert.deepEqual([10], results);
                delay.getCall(1).args[0]();
                assert.callCount(delay, 4);
                assert.deepEqual([10, 4], results);
                _.defer(function() {
                    _.defer(function() {
                        assert.callCount(delay, 4);
                        assert.deepEqual([10, 4], results);
                        delay.getCall(2).args[0]();
                        delay.getCall(3).args[0]();
                        assert.callCount(delay, 5);
                        assert.deepEqual([10, 4, 90, 20], results);
                        delay.getCall(4).args[0]();
                        assert.deepEqual([10, 4, 90, 20, 50], results);
                        assert.callCount(delay, 5);
                        done();
                    });
                });
            });
        });
    });
});