var ICO = artifacts.require("./test/TestICO.sol"),
    Howdoo = artifacts.require("./test/TestHowdoo.sol"),
    PrivateSale = artifacts.require("./test/TestPrivateSale.sol"),

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

var abi = require('ethereumjs-abi'),
    BN = require('bn.js'),
    signAddress = multivestAddress,
    wrongSigAddress = web3.eth.accounts[5];

async function makeTransactionKYC(instance, sign, address, value) {
    'use strict';
    var h = abi.soliditySHA3(['address'], [new BN(address.substr(2), 16)]),
        sig = web3.eth.sign(sign, h.toString('hex')).slice(2),
        r = `0x${sig.slice(0, 64)}`,
        s = `0x${sig.slice(64, 128)}`,
        v = web3.toDecimal(sig.slice(128, 130)) + 27;

    var data = abi.simpleEncode('multivestBuy(address,uint8,bytes32,bytes32)', address, v, r, s);

    return instance.sendTransaction({value: value, from: address, data: data.toString('hex')});

}

async function deploy() {
    const howdoo = await Howdoo.new(
        treasuryAddress,
        hisAddress,
        bountyAddress,
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

    const privateSale = await PrivateSale.new(
        multivestAddress,
        howdoo.address,
        etherHolder,
        icoSince,
        icoTill,
        new BigNumber('119493000').valueOf(),//1,194.930008
        new BigNumber('25000000').valueOf(),//25000000
        new BigNumber('44444444.4').mul(precision).valueOf(),//_maxTokenSupply
    );

    await howdoo.addMinter(ico.address);
    await howdoo.setICO(ico.address);

    await howdoo.addMinter(privateSale.address);
    await howdoo.setAllowedAddress(allowedAddress);

    return {howdoo, ico, privateSale};
}

contract('PrivateSale', function (accounts) {

    it("deploy & check constructor info & changeMinInvest & setHowdoo & setEtherHolder & setPrivateSale & getMinEthersInvestment", async function () {
        const {howdoo, ico, privateSale} = await deploy();

        assert.equal(await privateSale.getMinEthersInvestment.call(), new BigNumber('209217276325809880').valueOf(), "value is not equal");

        await privateSale.changeMinInvest(new BigNumber('28000000').valueOf(), {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await privateSale.changeMinInvest(new BigNumber('28000000').valueOf())
            .then(Utils.receiptShouldSucceed);

        assert.equal(await privateSale.getMinEthersInvestment.call(), new BigNumber('234323349484907065').valueOf(), "value is not equal");

        await privateSale.setHowdoo(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await privateSale.setHowdoo(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await privateSale.setHowdoo(accounts[2])
            .then(Utils.receiptShouldSucceed);

        await privateSale.setEtherHolder(accounts[3], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await privateSale.setEtherHolder(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await privateSale.setEtherHolder(accounts[3])
            .then(Utils.receiptShouldSucceed);

        await privateSale.setICO(accounts[3], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await privateSale.setICO(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await privateSale.setICO(accounts[3])
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({privateSale}, {
            privateSale: {
                minInvest: new BigNumber('28000000').valueOf(),
                howdoo: accounts[2],
                ico: accounts[3],
                maxTokenSupply: new BigNumber('44444444.4').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: accounts[3],
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

    });

    it("check getStats", async function () {
        const {howdoo, ico, privateSale} = await deploy();

        let stats = await privateSale.getStats(new BigNumber('3').mul(precision).valueOf(), new BigNumber('2').mul(precision).valueOf());
        assert.equal(stats[0], new BigNumber(icoSince).valueOf(), "startTime is not equal");
        assert.equal(stats[1], new BigNumber(icoTill).valueOf(), "endTime is not equal");
        assert.equal(stats[2], new BigNumber('0').mul(precision).valueOf(), "soldTokens is not equal");
        assert.equal(stats[3], new BigNumber('44444444.4').mul(precision).valueOf(), "maxTokenSupply is not equal");
        assert.equal(stats[4], new BigNumber('23898600000000000000000').valueOf(), "tokensPerEth is not equal");
        assert.equal(stats[5], new BigNumber('71695800000000000000000').valueOf(), "tokensPerBtc is not equal");
        assert.equal(stats[6], new BigNumber('47797200000000000000000').valueOf(), "tokensPerLtc is not equal");
        assert.equal(stats[7], new BigNumber('5000').valueOf(), "tokensPerLtc is not equal");


        icoSince = parseInt(new Date().getTime() / 1000) - 7200 * 2;
        icoTill = parseInt(new Date().getTime() / 1000) + 7200;
        await privateSale.testChangeICOPeriod(icoSince, icoTill);
        await privateSale.testChangeSoldTokens(new BigNumber('40000000').mul(precision).valueOf());

        stats = await privateSale.getStats(new BigNumber('3').mul(precision).valueOf(), new BigNumber('2').mul(precision).valueOf());
        assert.equal(stats[0], new BigNumber(icoSince).valueOf(), "startTime is not equal");
        assert.equal(stats[1], new BigNumber(icoTill).valueOf(), "endTime is not equal");
        assert.equal(stats[2], new BigNumber('40000000').mul(precision).valueOf(), "soldTokens is not equal");
        assert.equal(stats[3], new BigNumber('44444444.4').mul(precision).valueOf(), "maxTokenSupply is not equal");
        assert.equal(stats[4], new BigNumber('23898600000000000000000').valueOf(), "tokensPerEth is not equal");
        assert.equal(stats[5], new BigNumber('71695800000000000000000').valueOf(), "tokensPerBtc is not equal");
        assert.equal(stats[6], new BigNumber('47797200000000000000000').valueOf(), "tokensPerLtc is not equal");
        assert.equal(stats[7], new BigNumber('5000').valueOf(), "tokensPerLtc is not equal");

    });

    it('check whitelisting', async function () {
        const {howdoo, ico, privateSale} = await deploy();
        await privateSale.updateWhitelist(web3.eth.accounts[0], false);
        await privateSale.updateWhitelist(web3.eth.accounts[1], false);
        let other = accounts[5];
        await Utils.checkState({privateSale, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            },
            privateSale: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('44444444.4').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
                whitelist: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
            }
        });

        await privateSale.updateWhitelist(other, true);
        assert.equal(await privateSale.whitelist.call(other).valueOf(), true, 'whitelist isn\'t equal');

        other = accounts[1];
        await privateSale.updateWhitelist(other, true, {from: other})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        assert.equal(await privateSale.whitelist.call(other).valueOf(), false, 'whitelist isn\'t equal');
        await privateSale.updateWhitelist(other, true);
        assert.isTrue(await privateSale.whitelist.call(other).valueOf() == true);
        await privateSale.updateWhitelist(other, false, {from: other})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        assert.isTrue(await privateSale.whitelist.call(other).valueOf() == true);
        await privateSale.updateWhitelist(other, false)
        assert.isTrue(await privateSale.whitelist.call(other).valueOf() == false);
    });

    it('check transaction through whitelisting', async function () {
        const {howdoo, ico, privateSale} = await deploy();
        await privateSale.updateWhitelist(web3.eth.accounts[0], false);
        await privateSale.updateWhitelist(web3.eth.accounts[1], false);

        await Utils.checkState({privateSale, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            },
            privateSale: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('44444444.4').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
                whitelist: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
            }
        });

        await privateSale.sendTransaction({value: new BigNumber('1').mul(precision)})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await privateSale.updateWhitelist(accounts[0], true);
        await privateSale.updateWhitelist(accounts[1], true);

        //10 ^ 18 * 119493000 / 10000 * 125/100 = 17923950000000000000000
        await privateSale.sendTransaction({value: new BigNumber('1').mul(precision)})
            .then(Utils.receiptShouldSucceed);
        await privateSale.sendTransaction({value: new BigNumber('2').mul(precision), from: accounts[1]})
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({privateSale, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('23898600000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('47797200000000000000000').valueOf()},
                ],
            }
        });
    });

    it("check isActive & withinPeriod", async function () {
        const {howdoo, ico, privateSale} = await deploy();

        await Utils.checkState({privateSale}, {
            privateSale: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('44444444.4').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

        assert.equal(await privateSale.withinPeriod.call().valueOf(), true, "ico.withinPeriod().valueOf() not equal");
        assert.equal(await privateSale.isActive.call().valueOf(), true, "ico.isActive().valueOf() not equal");

        await privateSale.testChangeSoldTokens(new BigNumber('44444444.4').mul(precision).valueOf());

        await Utils.checkState({privateSale}, {
            privateSale: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('44444444.4').mul(precision).valueOf(),
                soldTokens: new BigNumber('44444444.4').mul(precision).valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

        assert.equal(await privateSale.isActive.call().valueOf(), false, "ico.isActive().valueOf() not equal");

        await privateSale.testChangeSoldTokens(new BigNumber(0).mul(precision).valueOf());

        await privateSale.testChangeICOPeriod(parseInt(new Date().getTime() / 1000 + 3600), parseInt(new Date().getTime() / 1000 + 7200));

        assert.equal(await privateSale.withinPeriod.call().valueOf(), false, "ico.withinPeriod().valueOf() not equal");
        assert.equal(await privateSale.isActive.call().valueOf(), false, "ico.isActive().valueOf() not equal");

        await privateSale.testChangeICOPeriod(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 - 3600));

        assert.equal(await privateSale.withinPeriod.call().valueOf(), false, "ico.withinPeriod().valueOf() not equal");
        assert.equal(await privateSale.isActive.call().valueOf(), false, "ico.isActive().valueOf() not equal");

        await privateSale.testChangeICOPeriod(parseInt(new Date().getTime() / 1000 - 3600), parseInt(new Date().getTime() / 1000 + 7200));

        assert.equal(await privateSale.withinPeriod.call().valueOf(), true, "ico.withinPeriod().valueOf() not equal");
        assert.equal(await privateSale.isActive.call().valueOf(), true, "ico.isActive().valueOf() not equal");

    });

    it("check calculateTokensAmount & minInvest & buyTokens & check ethers", async function () {
        const {howdoo, ico, privateSale} = await deploy();

        await Utils.checkState({privateSale}, {
            privateSale: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('44444444.4').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

        //1 token = 1 ether * etherInUsd / tier.price
        //10 ^ 18 * 119493000 / 5000 = 23898600000000000000000
        assert.equal(await privateSale.testCalculateTokensAmount.call(
            new BigNumber('1').mul(precision).valueOf(),
            new BigNumber('0').valueOf()
        ), new BigNumber('23898600000000000000000').valueOf(), "value is not equal");

        //check minInvest
        //250 usd | 1194.93usd
        //249 * 10 ^ 18 / 1194.93 = 208380407220506640.5563505812055936
        assert.equal(await privateSale.testCalculateTokensAmount.call(
            new BigNumber('208380407220506640').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('0').valueOf(), "value is not equal");

        //check minInvest
        //250 usd | 1194.93usd
        //250 * 10 ^ 18 / 1194.93 = 209217276325809880.0766572100457767
        //209217276325809880 * 119493000 / 5000 = 4999999999999999998168
        assert.equal(await privateSale.testCalculateTokensAmount.call(
            new BigNumber('209217276325809880').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('4999999999999999998168').valueOf(), "value is not equal");

        let ethBalanceEtherHolder = await Utils.getEtherBalance(etherHolder).valueOf();
        await privateSale.updateWhitelist(accounts[0], true);

        await privateSale.sendTransaction({value: new BigNumber('1').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({privateSale, howdoo}, {
            privateSale: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('44444444.4').mul(precision).valueOf(),
                soldTokens: new BigNumber('23898600000000000000000').valueOf(),
                collectedEthers: new BigNumber('1').mul(precision).valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            },
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('23898600000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            }
        });

        await Utils.checkEtherBalance(etherHolder, new BigNumber('1').mul(precision).add(ethBalanceEtherHolder).valueOf());

    });

    it("check calculateEthersAmount", async function () {
        const {howdoo, ico, privateSale} = await deploy();

        await Utils.checkState({privateSale}, {
            privateSale: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('44444444.4').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

        //1 token = 1 ether * etherInUsd / tier.price
        //10 ^ 18 * 119493000 / 5000 = 23898600000000000000000
        assert.equal(await privateSale.testCalculateEthersAmount.call(
            new BigNumber('23898600000000000000000').valueOf(),
            new BigNumber('0').valueOf()
        ), new BigNumber('1000000000000000000').valueOf(), "value is not equal");

        //check minInvest
        //250 usd | 1194.93usd
        //249 * 10 ^ 18 / 1194.93 = 208380407220506640.5563505812055936
        assert.equal(await privateSale.testCalculateEthersAmount.call(
            new BigNumber('4999999999999999998167').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('0').valueOf(), "value is not equal");

        //check minInvest
        //250 usd | 1194.93usd
        //250 * 10 ^ 18 / 1194.93 = 209217276325809880.0766572100457767
        //209217276325809880 * 119493000 / 5000 = 4999999999999999998168
        assert.equal(await privateSale.testCalculateEthersAmount.call(
            new BigNumber('4999999999999999998168').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('209217276325809880').valueOf(), "value is not equal");

        let ethBalanceEtherHolder = await Utils.getEtherBalance(etherHolder).valueOf();
        await privateSale.updateWhitelist(accounts[0], true);

        await privateSale.sendTransaction({value: new BigNumber('1').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({privateSale, howdoo}, {
            privateSale: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('44444444.4').mul(precision).valueOf(),
                soldTokens: new BigNumber('23898600000000000000000').valueOf(),
                collectedEthers: new BigNumber('1').mul(precision).valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            },
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('23898600000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            }
        });

        await Utils.checkEtherBalance(etherHolder, new BigNumber('1').mul(precision).add(ethBalanceEtherHolder).valueOf());
    });

    it("check moveUnsoldTokens", async function () {
        const {howdoo, ico, privateSale} = await deploy();

        await Utils.checkState({privateSale, ico}, {
            privateSale: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('44444444.4').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

        await privateSale.updateWhitelist(accounts[0], true);

        await privateSale.sendTransaction({value: new BigNumber('1').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);

        await privateSale.setICO(ico.address);
        await privateSale.moveUnsoldTokens({from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await privateSale.moveUnsoldTokens();
        await ico.setPrivateSale(privateSale.address);
        await privateSale.moveUnsoldTokens();

        await privateSale.testChangeICOPeriod(
            parseInt(new Date().getTime() / 1000) - 15778463 * 2,
            parseInt(new Date().getTime() / 1000) - 15778463 - 60 * 60 * 24
        );
        await privateSale.moveUnsoldTokens();

        await Utils.checkState({ico, howdoo, privateSale}, {
            privateSale: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('23898600000000000000000').valueOf(),
                soldTokens: new BigNumber('23898600000000000000000').valueOf(),
                collectedEthers: new BigNumber('1').mul(precision).valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            },
            ico: {
                maxTokenSupply: new BigNumber('311111110.8').add('44444444.4').mul(precision).sub('23898600000000000000000').valueOf(),
                investors: [
                    {[0]: accounts[0]},
                ],
            },
        });
        let stats = await ico.getStats(new BigNumber('3').mul(precision).valueOf(), new BigNumber('2').mul(precision).valueOf());

        assert.equal(stats[7][0], new BigNumber('133333333.2').add('44444444.4').mul(precision).sub('23898600000000000000000').valueOf(), "maxAmount is not equal");
    });

    it("check multivestBuyKYC", async function () {
        const {howdoo, privateSale} = await deploy();

        await Utils.checkState({privateSale, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            },
            privateSale: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('44444444.4').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ]
            }
        });

        await makeTransactionKYC(privateSale, wrongSigAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await makeTransactionKYC(privateSale, signAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({privateSale, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('23898600000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            },
            privateSale: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('44444444.4').mul(precision).valueOf(),
                soldTokens: new BigNumber('23898600000000000000000').valueOf(),
                collectedEthers: new BigNumber('1').mul(precision).valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ]
            }
        });

    });
});