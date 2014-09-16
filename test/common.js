var chai = require('chai');
var sinon = require('sinon');
var _ = require('lodash');
var assert = chai.assert;
_.each(sinon.assert, function(func, methodName) {
    assert[methodName] = function() {
        return sinon.assert[methodName].apply(null, arguments);
    };
});

module.exports = {
    assert: assert
};
