var asyncLimit = function(asyncFn, concurrencyLimit, ctx) {
    var state = {
        pending: 0,
        concurrencyLimit: concurrencyLimit,
        queue: [],
        ctx: ctx || null
    };

    var helpers = {
        step: function() {
            if ((state.pending < state.concurrencyLimit) && state.queue.length) {
                state.pending += 1;
                helpers.callFunc();
            }
        },
        callFunc: function() {
            params = state.queue.shift();
            var originalCallback = params.pop();
            params.push(function() {
                originalCallback.apply(null, arguments);
                state.pending -= 1;
                helpers.step();
            });
            asyncFn.apply(state.ctx, params);
        }
    };

    asyncLimit._internals = {
        state: state,
        helpers: helpers
    };

    return function() {
        var params = Array.prototype.slice.call(arguments);
        state.queue.push(params);
        helpers.step();
    };
};

asyncLimit._internals = {};

module.exports = asyncLimit;
