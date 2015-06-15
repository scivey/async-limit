async-limit
=================

Create a concurrency-constrained copy of an asynchronous javascript function.

Usage
----------

```javascript
var request = require('request');
var limit = require('async-limit');

var limitedGet = limit(request.get, 2);
limitedGet('http://www.google.com', function(err, res, body) {

});
limitedGet('http://www.jezebel.com', function(err, res, body) {

});
limitedGet('http://www.pinterest.com', function(err, res, body) {
    // `limitedGet` only permits two pending operations at a time,
    // so this one won't kick off till the first two have returned.
});
```

This is a relatively low-level primitive.  If you're using it as in the simple example above, you're better off with something like `mapLimit` from [async](https://github.com/caolan/async).

Its real use is in controlling behavior of the underlying method when individual calls are abstracted away by higher-level approaches to async control flow.  E.g., using the [co](https://github.com/visionmedia/) library to drive ES6 generators:

```javascript
var fs = require('fs');
var _ = require('lodash');
var co = require('co');
var request = require('request');
var thunkify = require('thunkify');
var limit = require('async-limit');

var get = thunkify(limit(request.get, 2));

var writeFile = thunkify(fs.writeFile);

co(function*() {
    var toGet = [
        {
            site: 'google',
            url: 'http://www.google.com'
        },
        {
            site: 'jezebel',
            url: 'http://www.jezebel.com'
        },
        {
            site: 'pinterest',
            url: 'http://www.pinterest.com'
        },
        {
            site: 'newyorker',
            url: 'http://www.newyorker.com'
        }
    ];
    var urlRequests = _.map(toGet, function(elem) {
        return get(elem.url);
    });
    var bodies = yield urlRequests;
    // `bodies` contains an array of the downloaded bodies
    // of the four URLs above, in the correct order.

    var asFiles = _.map(_.zip(toGet, bodies), function(elem) {
        return {
            fileName: ['./downloaded/', elem[0].site, '.html'].join(''),
            body: elem[1]
        };
    });
    var toWrite = _.map(asFiles, function(elem) {
        return writeFile(elem.fileName, elem.body);
    });
    yield toWrite;
})();
```

Here `async-limit` provides a way to control concurrency without any changes to the generator passed into `co`.  This allows the generator to cleanly express the operation's control flow (HTTP GET -> fs write) while remaining ignorant of lower-level implementation details.


Installation
------------

    npm install async-limit


Contact
------------
https://github.com/scivey

scott.ivey@gmail.com

License
------------
MIT License (MIT)

Copyright (c) 2014 Scott Ivey, <scott.ivey@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
