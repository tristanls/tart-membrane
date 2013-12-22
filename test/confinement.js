/*

confinement.js - confinement test script

The MIT License (MIT)

Copyright (c) 2013 Tristan Slominski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/
"use strict";

var membrane = require('../index.js');
var tart = require('tart-tracing');

var test = module.exports = {};

test.behaviors = {};
test.factory   = {};

test.behaviors['proxy created by membrane should pass message to proxied actor'] = function (test) {
    test.expect(2);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var membraneBehs = membrane.behaviors();

    var confined = sponsor(function (message) {
        test.equal(message, 'from outside membrane');
    });

    var proxy = sponsor(membraneBehs.proxy(confined));
    proxy('from outside membrane');

    test.ok(tracing.eventLoop());
    test.done();
};

test.factory['proxy created by membrane should pass message to proxied actor'] = function (test) {
    test.expect(2);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var membraneCaps = membrane.factory(sponsor);

    var confined = sponsor(function (message) {
        test.equal(message, 'from outside membrane');
    });

    var customer = sponsor(function (proxies) {
        var proxy = proxies[0];
        proxy('from outside membrane');
    });

    membraneCaps.proxy({customer: customer, actors: [confined]});

    test.ok(tracing.eventLoop());
    test.done();
};