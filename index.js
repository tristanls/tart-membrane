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

var assert = require('assert');

var membrane = module.exports;

var isUndefinedOrNull = function isUndefinedOrNull(value) {
    return value === null || value === undefined;
};

membrane.behaviors = function behaviors() {

    var inboundProxies = []; // proxies for actors "inside"
    var inboundProxied = []; // the "inside" actors that have a proxy
    var outboundProxies = []; // proxies for actors "outside"
    var outboundProxied = []; // the "outside" actors that have a proxy
    var revokeBehList = [];

    var rewriteInbound = function rewriteInbound(sponsor, message) {
        if (isUndefinedOrNull(message)) {
            return message;
        }

        if (typeof message === 'string' || typeof message === 'number') {
            return message;
        }

        if (Array.isArray(message)) {
            for (var i = 0; i < message.length; i++) {
                message.splice(i, 1, rewriteInbound(sponsor, message[i]));
            }
            return message;
        }

        if (typeof message === 'object') {
            var rewriteByCopy = false;
            if (Object.isFrozen(message)) {
                rewriteByCopy = true;
            }
            
            if (!rewriteByCopy) {
                Object.keys(message).forEach(function (key) {
                    message[key] = rewriteInbound(sponsor, message[key]);
                });
                return message;

            } else {
                var result = {};
                Object.keys(message).forEach(function (key) {
                    result[key] = rewriteInbound(sponsor, message[key]);
                });
                return result;

            }
        }

        assert.ok(typeof message === 'function');

        // check if message itself is an inboundProxy that should be replaced
        var index = inboundProxies.indexOf(message);
        if (index >= 0) {
            // substitute the proxied actor for the proxy
            return inboundProxied[index];
        }

        // check if message is an already proxied inner actor
        index = outboundProxied.indexOf(message);
        if (index >= 0) {
            // substitute existing proxy for the actor
            return outboundProxies[index];
        }

        // message is an outside actor and should be replaced
        var outboundProxyBeh = outboundProxy(message);
        var proxy = sponsor(outboundProxyBeh);
        outboundProxies.push(proxy);
        outboundProxied.push(message);

        return proxy;
    };

    var rewriteOutbound = function rewriteOutbound(sponsor, message) {
        if (isUndefinedOrNull(message)) {
            return message;
        }

        if (typeof message === 'string' || typeof message == 'number') {
            return message;
        }

        if (Array.isArray(message)) {
            for (var i = 0; i < message.length; i++) {
                message.splice(i, 1, rewriteOutbound(sponsor, message[i]));
            }
            return message;
        }

        if (typeof message === 'object') {
            var rewriteByCopy = false;
            if (Object.isFrozen(message)) {
                rewriteByCopy = true;
            }

            if (!rewriteByCopy) {
                Object.keys(message).forEach(function (key) {
                    message[key] = rewriteOutbound(sponsor, message[key]);
                });
                return message;
            } else {
                var result = {};
                Object.keys(message).forEach(function (key) {
                    result[key] = rewriteOutbound(sponsor, message[key]);
                });
                return result;
            }
        }

        assert.ok(typeof message === 'function');

        // check if message itself is an outboundProxy that should be replaced
        var index = outboundProxies.indexOf(message);
        if (index >= 0) {
            // substitute the proxied actor for the proxy
            return outboundProxied[index];
        }

        // check if message is an already proxied inner actor
        index = inboundProxied.indexOf(message);
        if (index >= 0) {
            // substitute existing proxy for the actor
            return inboundProxies[index];
        }

        // message is an inside actor and should be replaced
        var inboundProxyBeh = inboundProxy(message);
        var proxy = sponsor(inboundProxyBeh);
        inboundProxies.push(proxy);
        inboundProxied.push(message);

        return proxy;
    };

    var revokeBeh = function revokeBeh(customer) {
        var revokeProxyBeh;
        while (revokeProxyBeh = revokeBehList.shift()) {
            // create and then trigger revoke actors
            this.sponsor(revokeProxyBeh)();
        };
        customer();
    };

    var inboundProxy = function inboundProxy(actor) {
        var proxyBeh = function proxyBeh(message) {
            // because of bootstrapping needs, an inbound proxy could be created
            // external to the membrane itself
            // therefore, we have to make sure that we are tracking this 
            // proxy instance as well as the actor that it proxies
            if (inboundProxies.indexOf(this.self) < 0) {
                inboundProxies.push(this.self);
                inboundProxied.push(actor);
            }

            // proxy message contents and forward if proxy isn't revoked
            actor && actor(rewriteInbound(this.sponsor, message));
        };

        var revokeBeh = function revokeBeh(customer) {
            actor = null; // crash proxy
        };

        revokeBehList.push(revokeBeh);
        return proxyBeh;
    };

    var outboundProxy = function outboundProxy(actor) {
        var proxyBeh = function proxyBeh(message) {
            // proxy message contents and forward if proxy isn't revoked
            actor && actor(rewriteOutbound(this.sponsor, message));
        };

        var revokeBeh = function revokeBeh(customer) {
            actor = null; // crash proxy
        };

        revokeBehList.push(revokeBeh);
        return proxyBeh;
    };

    return {
        proxy: inboundProxy,
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