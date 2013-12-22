# tart-membrane

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

[![NPM version](https://badge.fury.io/js/tart-membrane.png)](http://npmjs.org/package/tart-membrane)

Implementation of a membrane for [Tiny Actor Run-Time in JavaScript](https://github.com/organix/tartjs).

## Contributors

[@dalnefre](https://github.com/dalnefre), [@tristanls](https://github.com/tristanls)

## Overview

An implementation of a membrane.

  * [Usage](#usage)
  * [Tests](#tests)
  * [Documentation](#documentation)
  * [Sources](#sources)

## Usage

To run the below example run:

    npm run readme

```javascript
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
```

## Tests

    npm test

## Documentation

## Sources

  * [Tiny Actor Run-Time (JavaScript)](https://github.com/organix/tartjs)