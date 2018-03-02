var ICO = artifacts.require("./test/TestICO.sol"),
    Howdoo = artifacts.require("./test/TestHowdoo.sol"),

    Utils = require("./utils"),
    BigNumber = require('bignumber.js'),

    precision = new BigNumber("1000000000000000000"),
    icoSince = parseInt(new Date().getTime() / 1000) - 3600,
    icoTill = parseInt(new Date().getTime() / 1000) + 3600,

    treasuryAddress = web3.eth.accounts[3],
    hisAddress = web3.eth.accounts[4],
    bountyAddress = web3.eth.accounts[5],
    allowedAddress = web3.eth.accounts[6],
    multivestAddress = web3.eth.accounts[7],
    etherHolder = web3.eth.accounts[8];

function makeTransaction(instance, value, add, from) {
    "use strict";
    return instance.multivestBuy(add, value, {from: from});
}

async function deploy() {
    const howdoo = await Howdoo.new(
        treasuryAddress,
        hisAddress,
        bountyAddress,
        allowedAddress,
        false
    );

    const ico = await ICO.new(
        multivestAddress,
        howdoo.address,
        etherHolder,
        new BigNumber('119493000').valueOf(),//1,194.930008
        new BigNumber('25000000').valueOf(),//25000000
        new BigNumber('311111110.8').mul(precision).valueOf(),//_maxTokenSupply
    );

    await howdoo.addMinter(ico.address);
    await howdoo.setICO(ico.address);

    return {howdoo, ico};
}

contract('Token', function (accounts) {
    // beforeEach(async function () {
    //
    // });
    it("deploy & check constructor info && initialAllocation & setICO & setLocked & transfer & approve & transferFrom & transferAllowed", async function () {
        const {howdoo, ico} = await deploy();

        await Utils.checkState({howdoo}, {
            howdoo: {
                ico: ico.address,
                treasuryAddress: treasuryAddress,
                bountyAddress: bountyAddress,
                hisAddress: hisAddress,
                allowedAddress: allowedAddress,
                maxSupply: new BigNumber('888888888').mul(precision).valueOf(),
                totalSupply: new BigNumber('378888888.52').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[ico.address]: true},
                    {[accounts[1]]: false},
                ],
                decimals: 18,
                name: 'uDOO',
                symbol: 'uDOO',
                standard: 'uDOO 0.1',
                locked: false,
                transferFrozen: true,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[allowedAddress]: new BigNumber('0').mul(precision).valueOf()},
                    {[treasuryAddress]: new BigNumber('177777777.6').mul(precision).valueOf()},
                    {[hisAddress]: new BigNumber('191111110.92').mul(precision).valueOf()},
                    {[bountyAddress]: new BigNumber('10000000').mul(precision).valueOf()},
                ],
            }
        });

        assert.equal(await howdoo.transferAllowed.call(accounts[1]), false, 'transferAllowed is not equal')
        assert.equal(await howdoo.transferAllowed.call(bountyAddress), true, 'transferAllowed is not equal')

        //setICO
        await howdoo.setICO(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await howdoo.setICO(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await howdoo.setICO(accounts[2])
            .then(Utils.receiptShouldSucceed);

        //SetLocked with transfers
        await howdoo.setLocked(true, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        assert.equal(await howdoo.locked.call(), false, 'locked is not equal')
        await howdoo.setLocked(true)
            .then(Utils.receiptShouldSucceed);
        assert.equal(await howdoo.locked.call(), true, 'locked is not equal')

        await howdoo.testSetFreezing(false);

        assert.equal(await howdoo.transferAllowed.call(accounts[1]), true, 'transferAllowed is not equal')
        assert.equal(await howdoo.transferAllowed.call(bountyAddress), true, 'transferAllowed is not equal')

        await howdoo.addMinter(accounts[3]);

        await Utils.checkState({howdoo}, {
            howdoo: {
                ico: accounts[2],
                treasuryAddress: treasuryAddress,
                bountyAddress: bountyAddress,
                hisAddress: hisAddress,
                allowedAddress: allowedAddress,
                maxSupply: new BigNumber('888888888').mul(precision).valueOf(),
                totalSupply: new BigNumber('378888888.52').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[ico.address]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                decimals: 18,
                name: 'uDOO',
                symbol: 'uDOO',
                standard: 'uDOO 0.1',
                locked: true,
                transferFrozen: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[allowedAddress]: new BigNumber('0').mul(precision).valueOf()},
                    {[treasuryAddress]: new BigNumber('177777777.6').mul(precision).valueOf()},
                    {[hisAddress]: new BigNumber('191111110.92').mul(precision).valueOf()},
                    {[bountyAddress]: new BigNumber('10000000').mul(precision).valueOf()},
                ],
            }
        });

        await howdoo.mint(accounts[0], 1000, {from: accounts[3]})
            .then(() => Utils.balanceShouldEqualTo(howdoo, accounts[0], 1000));

        await howdoo.transfer(accounts[1], 500)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await howdoo.approve(accounts[1], 500);

        assert.equal(await howdoo.transferFrom.call(accounts[0], accounts[1], 500, {from: accounts[1]}).valueOf(), false, 'transferFrom is not equal');

        await Utils.checkState({howdoo}, {
            howdoo: {
                ico: accounts[2],
                treasuryAddress: treasuryAddress,
                bountyAddress: bountyAddress,
                hisAddress: hisAddress,
                allowedAddress: allowedAddress,
                maxSupply: new BigNumber('888888888').mul(precision).valueOf(),
                totalSupply: new BigNumber('378888888.52').mul(precision).add('1000').valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[ico.address]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                decimals: 18,
                name: 'uDOO',
                symbol: 'uDOO',
                standard: 'uDOO 0.1',
                locked: true,
                transferFrozen: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('1000').valueOf()},
                    {[allowedAddress]: new BigNumber('0').mul(precision).valueOf()},
                    {[treasuryAddress]: new BigNumber('177777777.6').mul(precision).valueOf()},
                    {[hisAddress]: new BigNumber('191111110.92').mul(precision).valueOf()},
                    {[bountyAddress]: new BigNumber('10000000').mul(precision).valueOf()},
                ],
            }
        });

        await howdoo.setLocked(false)
            .then(Utils.receiptShouldSucceed);
        assert.equal(await howdoo.locked.call(), false, 'locked is not equal');

        await howdoo.transfer(accounts[1], 500)
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({howdoo}, {
            howdoo: {
                ico: accounts[2],
                treasuryAddress: treasuryAddress,
                bountyAddress: bountyAddress,
                hisAddress: hisAddress,
                allowedAddress: allowedAddress,
                maxSupply: new BigNumber('888888888').mul(precision).valueOf(),
                totalSupply: new BigNumber('378888888.52').mul(precision).add('1000').valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[ico.address]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                decimals: 18,
                name: 'uDOO',
                symbol: 'uDOO',
                standard: 'uDOO 0.1',
                locked: false,
                transferFrozen: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('500').valueOf()},
                    {[accounts[1]]: new BigNumber('500').valueOf()},
                    {[allowedAddress]: new BigNumber('0').mul(precision).valueOf()},
                    {[treasuryAddress]: new BigNumber('177777777.6').mul(precision).valueOf()},
                    {[hisAddress]: new BigNumber('191111110.92').mul(precision).valueOf()},
                    {[bountyAddress]: new BigNumber('10000000').mul(precision).valueOf()},
                ],
            }
        });

        await howdoo.approve(accounts[1], 500);
        await howdoo.transferFrom(accounts[0], accounts[1], 500, {from: accounts[1]});

        await Utils.checkState({howdoo}, {
            howdoo: {
                ico: accounts[2],
                treasuryAddress: treasuryAddress,
                bountyAddress: bountyAddress,
                hisAddress: hisAddress,
                allowedAddress: allowedAddress,
                maxSupply: new BigNumber('888888888').mul(precision).valueOf(),
                totalSupply: new BigNumber('378888888.52').mul(precision).add('1000').valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[ico.address]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                decimals: 18,
                name: 'uDOO',
                symbol: 'uDOO',
                standard: 'uDOO 0.1',
                locked: false,
                transferFrozen: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('1000').valueOf()},
                    {[allowedAddress]: new BigNumber('0').mul(precision).valueOf()},
                    {[treasuryAddress]: new BigNumber('177777777.6').mul(precision).valueOf()},
                    {[hisAddress]: new BigNumber('191111110.92').mul(precision).valueOf()},
                    {[bountyAddress]: new BigNumber('10000000').mul(precision).valueOf()},
                ],
            }
        });
    });

    it("deploy & freezing & transfer & approve & transferFrom & mint to allowedAddress", async function () {
        const {howdoo, ico} = await deploy();

        await howdoo.addMinter(accounts[3]);

        await howdoo.mint(accounts[0], 1500, {from: accounts[3]})
            .then(() => Utils.balanceShouldEqualTo(howdoo, accounts[0], 1500));

        await Utils.checkState({howdoo}, {
            howdoo: {
                ico: ico.address,
                treasuryAddress: treasuryAddress,
                bountyAddress: bountyAddress,
                hisAddress: hisAddress,
                allowedAddress: allowedAddress,
                maxSupply: new BigNumber('888888888').mul(precision).valueOf(),
                totalSupply: new BigNumber('378888888.52').mul(precision).add(1500).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[ico.address]: true},
                    {[accounts[1]]: false},
                ],
                decimals: 18,
                name: 'uDOO',
                symbol: 'uDOO',
                standard: 'uDOO 0.1',
                locked: false,
                transferFrozen: true,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('1500').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                    {[allowedAddress]: new BigNumber('0').mul(precision).valueOf()},
                    {[treasuryAddress]: new BigNumber('177777777.6').mul(precision).valueOf()},
                    {[hisAddress]: new BigNumber('191111110.92').mul(precision).valueOf()},
                    {[bountyAddress]: new BigNumber('10000000').mul(precision).valueOf()},
                ],
            }
        });

        assert.equal(await howdoo.mint.call(accounts[5], 1500), 0, 'mint is not equal');
        assert.equal(await howdoo.mint.call(allowedAddress, 1500), 1500, 'mint is not equal');

        await howdoo.freezing(false, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        assert.equal(await howdoo.transferFrozen.call(), true, 'transferFrozen is not equal');
        await howdoo.freezing(false);
        assert.equal(await howdoo.transferFrozen.call(), true, 'transferFrozen is not equal');

        await howdoo.transfer(accounts[1], 500)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await howdoo.approve(accounts[1], 500);
        await howdoo.transferFrom(accounts[0], accounts[1], 500, {from: accounts[0]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await howdoo.transfer(allowedAddress, 500, {from: bountyAddress})
            .then(Utils.receiptShouldSucceed);

        await ico.changePreICODates(parseInt(new Date().getTime() / 1000 - 7200 * 2), parseInt(new Date().getTime() / 1000 - 3600 * 2));
        await ico.changeICODates(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 - 3600));

        assert.equal(await ico.isICOFinished.call().valueOf(), true, "ico.isActive().valueOf() not equal");

        await howdoo.freezing(false);
        assert.equal(await howdoo.transferFrozen.call(), false, 'transferFrozen is not equal');

        assert.equal(await howdoo.mint.call(accounts[5], 1500), 1500, 'mint is not equal');
        assert.equal(await howdoo.mint.call(allowedAddress, 1500), 1500, 'mint is not equal');

        await howdoo.transfer(accounts[1], 500)
            .then(Utils.receiptShouldSucceed);
        await howdoo.approve(accounts[1], 500);
        await howdoo.transferFrom(accounts[0], accounts[1], 500, {from: accounts[1]})
            .then(Utils.receiptShouldSucceed);


        await Utils.checkState({howdoo}, {
            howdoo: {
                ico: ico.address,
                treasuryAddress: treasuryAddress,
                bountyAddress: bountyAddress,
                hisAddress: hisAddress,
                allowedAddress: allowedAddress,
                maxSupply: new BigNumber('888888888').mul(precision).valueOf(),
                totalSupply: new BigNumber('378888888.52').mul(precision).add(1500).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[ico.address]: true},
                    {[accounts[1]]: false},
                ],
                decimals: 18,
                name: 'uDOO',
                symbol: 'uDOO',
                standard: 'uDOO 0.1',
                locked: false,
                transferFrozen: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('500').valueOf()},
                    {[accounts[1]]: new BigNumber('1000').valueOf()},
                    {[allowedAddress]: new BigNumber('500').valueOf()},
                    {[treasuryAddress]: new BigNumber('177777777.6').mul(precision).valueOf()},
                    {[hisAddress]: new BigNumber('191111110.92').mul(precision).valueOf()},
                    {[bountyAddress]: new BigNumber('10000000').mul(precision).sub(500).valueOf()},
                ],
            }
        });


    });

});