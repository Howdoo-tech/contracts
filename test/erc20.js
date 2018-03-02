var ERC20 = artifacts.require("./HowdooERC20.sol");
var Utils = require("./utils");

var BigNumber = require('bignumber.js');


/*
    + deploy & check for total supply & balance of smart contract & sender
    + transfer with disabled transfer
    + transfer with enabled transfer
    - transfer from with disabled transfer
    - transfer from with enabled transfer
*/

contract('ERC20', function(accounts) {
    beforeEach(async function () {

    });
    it("deploy & check for total supply & balance of smart contract & sender", function() {
        var instance;

        return ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            false,
            true
        ).then(function(_instance) {
            instance = _instance;
        })
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 0));
    });

    it("transfer with enabled lock", function() {
        var instance;

        return ERC20.new(
                1000000,
                "TEST",
                18,
                "TEST",
                true,
                true
            ).then(function(_instance) {
                instance = _instance;
            })
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
        .then(function() {
            return instance.transfer(accounts[1], 1000);
        })
        .then(Utils.receiptShouldFailed)
        .catch(Utils.catchReceiptShouldFailed)
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
    });

    it("transfer with disabled lock", function() {
        var instance;

        return ERC20.new(
                1000000,
                "TEST",
                18,
                "TEST",
                true,
                false
            ).then(function(_instance) {
                instance = _instance;
            })
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
        .then(function() {
            return instance.transfer(accounts[1], 1000);
        })
        .then(Utils.receiptShouldSucceed)
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 999000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 1000))
        .then(function() {
            return instance.transfer(accounts[1], 1000);
        })
        .then(Utils.receiptShouldSucceed)
        .then(function() {
            return instance.transfer(accounts[1], 1000);
        })
        .then(Utils.receiptShouldSucceed)
        .then(function() {
            return instance.transfer(accounts[1], 1000);
        })
        .then(Utils.receiptShouldSucceed)
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 996000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 4000));
    });

    it("approve, transfer by transferFrom", function() {
        var instance;

        return ERC20.new(
                1000000,
                "TEST",
                18,
                "TEST",
                true,
                false
            ).then(function(_instance) {
                instance = _instance;
            })
                .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
        .then(function() {
            return instance.approve(accounts[1], 1000);
        })
            .then(Utils.receiptShouldSucceed)
            .then(function() {
                return instance.allowance.call(accounts[0], accounts[1]);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 1000, "allowance is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(function() {
                return instance.transferFrom(accounts[0], accounts[1], 1001, {from: accounts[1]});
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(function() {
                return instance.transferFrom(accounts[0], accounts[1], 1000, {from: accounts[1]});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 999000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 1000))
        .then(function() {
            return instance.allowance.call(accounts[0], accounts[1]);
        })
            .then(function(result) {
                assert.equal(result.valueOf(), 0, "allowance is not equal");
            });
    });

    it("approve, transfer by transferFrom with locked", function() {
        var instance;

        return ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
            true
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
            .then(function() {
                return instance.approve(accounts[1], 1000);
            })
            .then(Utils.receiptShouldSucceed)
            .then(function() {
                return instance.allowance.call(accounts[0], accounts[1]);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 0, "allowance is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(function() {
                return instance.transferFrom(accounts[0], accounts[1], 1001, {from: accounts[1]});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(function() {
                return instance.transferFrom(accounts[0], accounts[1], 1000, {from: accounts[1]});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(function() {
                return instance.allowance.call(accounts[0], accounts[1]);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 0, "allowance is not equal");
            });
    });

    it("approve, transferFrom more than exists", function() {
        var instance;

        return ERC20.new(
                1000000,
                "TEST",
                18,
                "TEST",
                true,
                false
            ).then(function(_instance) {
                instance = _instance;
            })
                .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
        .then(function() {
            return instance.approve(accounts[1], 2000000);
        })
            .then(Utils.receiptShouldSucceed)
            .then(function() {
                return instance.allowance.call(accounts[0], accounts[1]);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 2000000, "allowance is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(function() {
                return instance.transferFrom(accounts[0], accounts[1], 1000001, {from: accounts[1]});
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
        .then(function() {
            return instance.allowance.call(accounts[0], accounts[1]);
        })
            .then(function(result) {
                assert.equal(result.valueOf(), 2000000, "allowance is not equal");
            });
    });

    it("try to transfer tokens to itself", function() {
        "use strict";

        var instance;

        return ERC20.new(
                1000000,
                "TEST",
                18,
                "TEST",
                true,
                false
            ).then(function(_instance) {
                instance = _instance;
            })
                .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
        .then(function() {
            return instance.transfer(accounts[0], 1000);
        })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
    });


    it('shouldn\'t not be able increase or decrease when contract is locked then unlock', async function() {
        "use strict";

        var instance;

        return ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
            true
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        let postIncrease;
        await instance.increaseApproval(accounts[1], 50)
        // preApproved.plus(50).should.be.bignumber.equal(postIncrease);
            .then(() => instance.allowance.call(accounts[0], accounts[1]))
            .then((result) =>{
                postIncrease = result.valueOf();
                assert.equal(result.valueOf(), 0, "should be 0")
            });
        await instance.decreaseApproval(accounts[1], 10)
            .then(() => instance.allowance.call(accounts[0], accounts[1]))
            .then((result) => assert.equal(result.valueOf(),  0, "should be  0"));
        await instance.setLocked(false)
        await instance.increaseApproval(accounts[1], 50)
        await instance.decreaseApproval(accounts[1], 10)
            .then(() => instance.allowance.call(accounts[0], accounts[1]))
            .then((result) => assert.equal(result.valueOf(),  40, "should be  0"));
    })

    it('should increase by 50 then decrease by 10', async function() {
        let postIncrease = 0, preApproved =0;
         token = await ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
            false
        );
        await token.increaseApproval(accounts[1], 50)
        // preApproved.plus(50).should.be.bignumber.equal(postIncrease);
            .then(() => token.allowance.call(accounts[0], accounts[1]))
            .then((result) =>{
                postIncrease = result.valueOf();
                assert.equal(result.valueOf(), preApproved+50, "should be preApproved.plus(50)")
            });
        await token.decreaseApproval(accounts[1], 10)
        .then(() => token.allowance.call(accounts[0], accounts[1]))
            .then((result) => assert.equal(result.valueOf(),  postIncrease -10, "should be  postIncrease.minus(10)"));
        // postIncrease.minus(10).should.be.bignumber.equal(postDecrease);
    })

    it('shouldn\'t not be able increase or decrease when contract is locked', async function() {
        let postIncrease = 0, preApproved =0;
        token = await ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
            true
        );
        await token.increaseApproval(accounts[1], 50)
            .then(() => token.allowance.call(accounts[0], accounts[1]))
            .then((result) =>{
                postIncrease = result.valueOf();
                assert.equal(result.valueOf(), 0, "should be preApproved.plus(50)")
            });
        await token.decreaseApproval(accounts[1], 10)
            .then(() => token.allowance.call(accounts[0], accounts[1]))
            .then((result) => assert.equal(result.valueOf(),  0, "should be  postIncrease.minus(10)"));
    })
});