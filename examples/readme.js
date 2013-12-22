/*

readme.js - example from the README

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
var tart = require('tart');

var sponsor = tart.minimal();


var aliceReport = function aliceReport(charlie) {
    return function aliceReportBeh(message) {
        var alice = this.self;
        console.log('alice received response from charlie');
        console.log('message.alice === alice:', message.alice === alice);
        console.log('message.charlie === charlie:', message.charlie === charlie);
    };
};

var aliceBeh = function aliceBeh(message) {
    var alice = this.self;
    // send charlie everything alice knows
    message.charlie({alice: alice, charlie: message.charlie});
    this.behavior = aliceReport(message.charlie);
};

var charlieBeh = function charlieBeh(message) {
    var charlie = this.self;
    // send alice everything charlie knows
    message.alice({alice: message.alice, charlie: charlie});
    console.log('charlie received message from alice');
    console.log('message.charlie === charlie:', message.charlie === charlie);
};

var alice = sponsor(aliceBeh);
var charlie = sponsor(charlieBeh);

var membraneBehs = membrane.behaviors();
var revokeMembrane = sponsor(membraneBehs.revokeBeh);

var charlieProxyBeh = membraneBehs.proxy(charlie);
var charlieProxy = sponsor(charlieProxyBeh);

// get alice to send message to charlie and report a response
alice({charlie: charlieProxy});

// alternatively, membrane factory pattern can be used

var membraneFactoryCaps = membrane.factory(sponsor);

var dennis = sponsor(function () {});
var dennisProxy1 = membraneFactoryCaps.proxy(dennis);
var dennisProxy2 = membraneFactoryCaps.proxy(dennis);
console.log('dennisProxy1 === dennisProxy2:', dennisProxy1 === dennisProxy2);