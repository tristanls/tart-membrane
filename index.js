/*

index.js - "tart-membrane": Tart implementation of a membrane

The MIT License (MIT)

Copyright (c) 2013 Dale Schumacher, Tristan Slominski

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

var revocable = require('tart-revocable');

var membrane = module.exports;

membrane.behaviors = function behaviors() {

    var revokeBehList = [];

    var revokeBeh = function revokeBeh(customer) {
        var revokeProxyBeh;
        while (revokeProxyBeh = revokeBehList.shift()) {
            // create and then trigger revoke actors
            this.sponsor(revokeProxyBeh)();
        };
        customer();
    };

    var proxy = function proxy(actor) {
        var capabilities = revocable.proxy(actor);
        revokeBehList.push(capabilities.revokeBeh);
        return capabilities.proxyBeh;
    };

    return {
        proxy: proxy,
        revokeBeh: revokeBeh
    };
};

membrane.factory = function factory(sponsor) {

    var behaviors = membrane.behaviors();

    var proxyBeh = function proxyBeh(message) {
        var proxies = [];
        for (var i = 0; i < message.actors.length; i++) {
            var actorProxyBeh = behaviors.proxy(message.actors[i]);
            proxies.push(this.sponsor(actorProxyBeh));
        }
        message.customer(proxies);
    };

    return {
        proxy: sponsor(proxyBeh),
        revoke: sponsor(behaviors.revokeBeh)
    };
};