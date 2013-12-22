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

test.behaviors['revoked membrane should not pass message to proxied actor'] = function (test) {
    test.expect(2);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var membraneBehs = membrane.behaviors();

    var confined = sponsor(function (message) {
        test.ok(false, 'should not receive message');
    });

    var proxy = sponsor(membraneBehs.proxy(confined));
    var revoke = sponsor(membraneBehs.revokeBeh);

    var ackCustomerBeh = function ackCustomerBeh(message) {
        test.ok(true); // revoke was acked
        proxy('this message should not reach confined actor');
    };

    var ackCustomer = sponsor(ackCustomerBeh);
    revoke(ackCustomer);

    var ignore = function () {};

    test.ok(tracing.eventLoop({fail: ignore}));
    test.done();
};

test.factory['revoked membrane should not pass message to proxied actor'] = function (test) {
    test.expect(3);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var membraneCaps = membrane.factory(sponsor);

    var confined = sponsor(function (message) {
        test.ok(false, 'should not receive message');
    });

    var revokeStepBeh = function revokeStepBeh(proxies) {
        test.ok(true); // proxies were created
        var proxy = proxies[0];
        membraneCaps.revoke(this.self);
        this.behavior = tryProxy(proxy);
    };

    var tryProxy = function tryProxy(proxy) {
        return function tryProxyBeh(message) {
            test.ok(true); // revoke was acked
            proxy('this message should not reach confined actor');
        };
    };

    membraneCaps.proxy({customer: sponsor(revokeStepBeh), actors: [confined]});

    var ignore = function () {};

    test.ok(tracing.eventLoop({fail: ignore}));
    test.done();
};

test.behaviors['external reference should be proxied when inbound'] = function (test) {
    test.expect(2);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var membraneBehs = membrane.behaviors();

    var externalRef = sponsor(function () {});

    var confined = sponsor(function (message) {
        test.notStrictEqual(message.external, externalRef);
    });

    var proxy = sponsor(membraneBehs.proxy(confined));
    proxy({external: externalRef});

    test.ok(tracing.eventLoop());
    test.done();
};

test.factory['external reference should be proxied when inbound'] = function (test) {
    test.expect(3);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var membraneCaps = membrane.factory(sponsor);

    var externalRef = sponsor(function () {});

    var confined = sponsor(function (message) {
        test.notStrictEqual(message.external, externalRef);
    });

    var sendExternalRefBeh = function sendExternalRefBeh(proxies) {
        test.ok(true); // proxies were created
        var proxy = proxies[0];
        proxy({external: externalRef});        
    };

    membraneCaps.proxy({
        customer: sponsor(sendExternalRefBeh), 
        actors: [confined]
    });

    test.ok(tracing.eventLoop());
    test.done();
};

test.behaviors['internal reference should be proxied when outbound'] = function (test) {
    test.expect(2);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var membraneBehs = membrane.behaviors();

    var internalRef = sponsor(function () {});

    var confined = sponsor(function (customer) {
        customer(internalRef);
    });

    var externalCust = sponsor(function (internal) {
        test.notStrictEqual(internal, internalRef);
    });

    var proxy = sponsor(membraneBehs.proxy(confined));
    proxy(externalCust);

    test.ok(tracing.eventLoop());
    test.done();
};

test.factory['internal reference should be proxied when outbound'] = function (test) {
    test.expect(3);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var membraneCaps = membrane.factory(sponsor);

    var internalRef = sponsor(function () {});

    var confined = sponsor(function (customer) {
        customer(internalRef);
    });

    var externalCust = sponsor(function (internal) {
        test.notStrictEqual(internal, internalRef);
    });

    var sendCustomerBeh = function sendCustomerBeh(proxies) {
        test.ok(true); // proxies were created
        var proxy = proxies[0];
        proxy(externalCust);        
    };

    membraneCaps.proxy({
        customer: sponsor(sendCustomerBeh), 
        actors: [confined]
    });

    test.ok(tracing.eventLoop());
    test.done();
};

test.behaviors['internal proxy reference should be rewritten with internal reference when inbound'] = function (test) {
    test.expect(2);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var membraneBehs = membrane.behaviors();

    var confined = sponsor(function (self) {
        test.strictEqual(this.self, self);
    });

    var proxy = sponsor(membraneBehs.proxy(confined));
    proxy(proxy);

    test.ok(tracing.eventLoop());
    test.done();
};

test.factory['internal proxy reference should be rewritten with internal reference when inbound'] = function (test) {
    test.expect(3);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    var membraneCaps = membrane.factory(sponsor);

    var confined = sponsor(function (self) {
        test.strictEqual(this.self, self);
    });

    var sendConfinedBeh = function sendConfinedBeh(proxies) {
        test.ok(true); // proxies were created
        var proxy = proxies[0];
        proxy(proxy);        
    };

    membraneCaps.proxy({
        customer: sponsor(sendConfinedBeh), 
        actors: [confined]
    });

    test.ok(tracing.eventLoop());
    test.done();
};