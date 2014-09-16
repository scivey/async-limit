var sinon = require('sinon');
var _ = require('lodash');
var assert = require('../common').assert;

var asyncLimit = require('../../index');

describe('async-limit', function() {

    var asyncFunc;
    beforeEach(function() {
        asyncFunc = sinon.stub();
    });

    describe('limiting', function() {
        var limited, ctx, internals;
        beforeEach(function() {
            ctx = {ctx: true};
            limited = asyncLimit(asyncFunc, 3, ctx);
            internals = asyncLimit._internals;
        });
        it('has internal state', function() {
            var state = internals.state;
            assert.equal(0, state.pending);
            assert.equal(3, state.concurrencyLimit);
            assert.isArray(state.queue);
            assert.equal(0, state.queue.length);
            assert.equal(ctx, state.ctx);
        });
        it('exposes helper methods', function() {
            var helpers = internals.helpers;
            assert.isFunction(helpers.step);
            assert.isFunction(helpers.callFunc);
        });
        describe('helpers:step', function() {
            var helpers, state;
            beforeEach(function() {
                helpers = internals.helpers;
                state = internals.state;
                helpers.callFunc = sinon.stub();
            });
            it('if number of pending operations is less than limit and tasks are in the queue, invokes #callFunc and increments pending count', function() {
                state.queue = {length: 1};
                state.concurrencyLimit = 3;
                state.pending = 1;
                helpers.step();
                assert.called(helpers.callFunc);
                assert.equal(2, state.pending);
            });
            it('if number of pending operations at limit, does not invoke #callFunc', function() {
                state.concurrencyLimit = 2;
                state.pending = 2;
                state.queue = {length: 1};
                helpers.step();
                assert.notCalled(helpers.callFunc);
                assert.equal(2, state.pending);
            });
            it('does not invoke #callFunc if no tasks in queue, even if below concurrencyLimit', function() {
                state.queue = {length: 0};
                state.concurrencyLimit = 3;
                state.pending = 1;
                helpers.step();
                assert.notCalled(helpers.callFunc);
                assert.equal(1, state.pending);
            });
        });
        describe('helpers:callFunc', function() {
            var helpers, state, originalCallback;
            beforeEach(function() {
                helpers = internals.helpers;
                state = internals.state;
                helpers.step = sinon.stub();
                originalCallback = sinon.stub();
                state.pending = 1;
                state.queue = [['x', 'y', originalCallback]];
            });
            it('shifts the next task off the bottom of the queue (FIFO), replacing its callback with an intermediary', function() {
                helpers.callFunc();
                assert.calledOn(asyncFunc, ctx);
                assert.calledWith(asyncFunc, 'x', 'y', sinon.match.func);
                assert.calledOnce(asyncFunc);
                var passedCallback = asyncFunc.getCall(0).args[2];
                assert.notEqual(originalCallback, passedCallback);
            });
            describe('intermediate callback', function() {
                var passedCallback;
                beforeEach(function() {
                    helpers.callFunc();
                    passedCallback = asyncFunc.getCall(0).args[2];
                });
                it('adjusts pending count, invokes original callback, and then invokes #step', function() {
                    assert.notCalled(originalCallback);
                    assert.notCalled(helpers.step);
                    assert.equal(1, state.pending);
                    passedCallback(1, 2, 3);
                    assert.calledWith(originalCallback, 1, 2, 3);
                    assert.equal(0, state.pending);
                    assert.called(helpers.step);
                });
            });
        });
        describe('limited function returned', function() {
            var helpers, state;
            beforeEach(function() {
                helpers = internals.helpers;
                state = internals.state;
                helpers.step = sinon.stub();
            });
            it('pushes arguments onto the queue and calls #step', function() {
                assert.equal(0, state.queue.length);
                var callback = sinon.stub();
                limited('a', 'b', 'c', callback);
                assert.deepEqual([['a', 'b', 'c', callback]], state.queue);
                assert.calledOnce(helpers.step);
            });
        });
    });
});