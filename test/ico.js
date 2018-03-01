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
        allowedAddress,
        false
    );

    const ico = await ICO.new(
        multivestAddress,
        howdoo.address,
        etherHolder,
        icoSince,// _startTime,
        icoTill, //_endTime,
        new BigNumber('119493000').valueOf(),//1,194.930008
        new BigNumber('25000000').valueOf(),//25000000
        new BigNumber('311111110.8').mul(precision).valueOf(),//_maxTokenSupply
    );

    await howdoo.addMinter(ico.address);
    await howdoo.setICO(ico.address);
    await ico.updateWhitelist(web3.eth.accounts[0], true);
    await ico.updateWhitelist(web3.eth.accounts[1], true);

    return {howdoo, ico};
}

contract('ICO', function (accounts) {
/*
    it("deploy & check constructor info & changeMinInvest & setHowdoo & setEtherHolder", async function () {
        const {howdoo, ico} = await deploy();

        await Utils.checkState({ico}, {
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
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

        await ico.changeMinInvest(new BigNumber('28000000').valueOf(), {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await ico.changeMinInvest(new BigNumber('28000000').valueOf())
            .then(Utils.receiptShouldSucceed);

        await ico.setHowdoo(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await ico.setHowdoo(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await ico.setHowdoo(accounts[2])
            .then(Utils.receiptShouldSucceed);

        await ico.setEtherHolder(accounts[3], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await ico.setEtherHolder(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await ico.setEtherHolder(accounts[3])
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico}, {
            ico: {
                minInvest: new BigNumber('28000000').valueOf(),
                howdoo: accounts[2],
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
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

    it("check calculateTokensAmount & minInvest & buyTokens & check ethers", async function () {
        const {howdoo, ico} = await deploy();

        await Utils.checkState({ico}, {
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
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
        assert.equal(await ico.testCalculateTokensAmount.call(
            new BigNumber('1').mul(precision).valueOf(),
            new BigNumber('0').valueOf()
        ), new BigNumber('23898600000000000000000').valueOf(), "value is not equal");

        //1 token = 1 ether * etherInUsd / tier.price
        //10 ^ 18 * 119493000 / 5000 = 23898600000000000000000 | 23898.6 tokens
        //(10 ^ 18 * (5000 * 1000)) / 119493000 = 41843455265161976.0153314420091553
        //((10 ^ 18) - 41843455265161976) * 119493000 / 8000 = 14311625000000000000229
        //14311625000000000000229 + 1000 * 10 ^ 18 = 15311625000000000000229
        assert.equal(await ico.testCalculateTokensAmount.call(
            new BigNumber('1').mul(precision).valueOf(),
            new BigNumber('44443444.4').mul(precision).valueOf()
        ), new BigNumber('15311625000000000000229').valueOf(), "value is not equal");

        //check minInvest
        //250 usd | 1194.93usd
        //249 * 10 ^ 18 / 1194.93 = 208380407220506640.5563505812055936
        assert.equal(await ico.testCalculateTokensAmount.call(
            new BigNumber('208380407220506640').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('0').valueOf(), "value is not equal");

        //check minInvest
        //250 usd | 1194.93usd
        //250 * 10 ^ 18 / 1194.93 = 209217276325809880.0766572100457767
        //209217276325809880 * 119493000 / 5000 = 4999999999999999998168
        assert.equal(await ico.testCalculateTokensAmount.call(
            new BigNumber('209217276325809880').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('4999999999999999998168').valueOf(), "value is not equal");

        let ethBalanceEtherHolder = await Utils.getEtherBalance(etherHolder).valueOf();

        await ico.sendTransaction({value:  new BigNumber('1').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico, howdoo}, {
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
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
        const {howdoo, ico} = await deploy();

        await Utils.checkState({ico}, {
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
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
        assert.equal(await ico.testCalculateEthersAmount.call(
            new BigNumber('23898600000000000000000').valueOf(),
            new BigNumber('0').valueOf()
        ), new BigNumber('1000000000000000000').valueOf(), "value is not equal");

        //1 token = 1 ether * etherInUsd / tier.price
        //10 ^ 18 * 119493000 / 5000 = 23898600000000000000000 | 23898.6 tokens
        //(10 ^ 18 * (5000 * 1000)) / 119493000 = 41843455265161976.0153314420091553
        //((10 ^ 18) - 41843455265161976) * 119493000 / 8000 = 14311625000000000000229
        //14311625000000000000229 + 1000 * 10 ^ 18 = 15311625000000000000229
        assert.equal(await ico.testCalculateEthersAmount.call(
            new BigNumber('15311625000000000000229').valueOf(),
            new BigNumber('44443444.4').mul(precision).valueOf()
        ), new BigNumber('1').mul(precision).valueOf(), "value is not equal");

        //check minInvest
        //250 usd | 1194.93usd
        //249 * 10 ^ 18 / 1194.93 = 208380407220506640.5563505812055936
        assert.equal(await ico.testCalculateEthersAmount.call(
            new BigNumber('4999999999999999998167').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('0').valueOf(), "value is not equal");

        //check minInvest
        //250 usd | 1194.93usd
        //250 * 10 ^ 18 / 1194.93 = 209217276325809880.0766572100457767
        //209217276325809880 * 119493000 / 5000 = 4999999999999999998168
        assert.equal(await ico.testCalculateEthersAmount.call(
            new BigNumber('4999999999999999998168').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('209217276325809880').valueOf(), "value is not equal");

        let ethBalanceEtherHolder = await Utils.getEtherBalance(etherHolder).valueOf();

        await ico.sendTransaction({value:  new BigNumber('1').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico, howdoo}, {
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
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

    it("check isActive & withinPeriod & setEtherInUSD", async function () {
        const {howdoo, ico} = await deploy();

        await Utils.checkState({ico}, {
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
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

        assert.equal(await ico.withinPeriod.call().valueOf(), true, "ico.withinPeriod().valueOf() not equal");
        assert.equal(await ico.isActive.call().valueOf(), true, "ico.isActive().valueOf() not equal");

        await ico.testChangeSoldTokens(new BigNumber('311111110.8').mul(precision).valueOf());

        await Utils.checkState({ico}, {
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
                soldTokens: new BigNumber('311111110.8').mul(precision).valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

        assert.equal(await ico.isActive.call().valueOf(), false, "ico.isActive().valueOf() not equal");

        await ico.testChangeSoldTokens(new BigNumber(0).mul(precision).valueOf());

        await ico.testChangeICOPeriod(parseInt(new Date().getTime() / 1000 + 3600), parseInt(new Date().getTime() / 1000 + 7200));

        assert.equal(await ico.withinPeriod.call().valueOf(), false, "ico.withinPeriod().valueOf() not equal");
        assert.equal(await ico.isActive.call().valueOf(), false, "ico.isActive().valueOf() not equal");

        await ico.testChangeICOPeriod(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 - 3600));

        assert.equal(await ico.withinPeriod.call().valueOf(), false, "ico.withinPeriod().valueOf() not equal");
        assert.equal(await ico.isActive.call().valueOf(), false, "ico.isActive().valueOf() not equal");

        await ico.testChangeICOPeriod(parseInt(new Date().getTime() / 1000 - 3600), parseInt(new Date().getTime() / 1000 + 7200));

        assert.equal(await ico.withinPeriod.call().valueOf(), true, "ico.withinPeriod().valueOf() not equal");
        assert.equal(await ico.isActive.call().valueOf(), true, "ico.isActive().valueOf() not equal");

        //check set ethers in usd
        assert.equal(await ico.etherPriceInUSD.call().valueOf(), new BigNumber('119493000').valueOf(), "etherPriceInUSD not equal");

        await ico.setEtherInUSD('1194.280008')
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.setEtherInUSD('1194.28000', {from: bountyAddress})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.setEtherInUSD('1194.28000', {from: multivestAddress})
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico}, {
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').mul(precision).valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('119428000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

    });

    it("check airdrop 1", async function () {
        const {howdoo, ico} = await deploy();

        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
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

        await ico.sendTransaction({value:  new BigNumber('1').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);

        await ico.sendTransaction({value:  new BigNumber('1').mul(precision).valueOf(), from: accounts[1]})
            .then(Utils.receiptShouldSucceed);

        await ico.mint(accounts[1], new BigNumber('23898600000000000000000').valueOf(), {from: accounts[8]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.mint(accounts[1], new BigNumber('23898600000000000000000').valueOf())
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('23898600000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('47797200000000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('191111110.92').mul(precision).valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
                soldTokens: new BigNumber('71695800000000000000000').valueOf(),
                collectedEthers: new BigNumber('2').mul(precision).valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

        await ico.testChangeICOPeriod(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 - 3600));

        await ico.airdrop(100, {from: bountyAddress})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.airdrop(100)
            .then(Utils.receiptShouldSucceed);

        // 311111110.8 * 10 ^ 18 - 71695800000000000000000 = 311039415000000000000000000
        // hisAccount 191111110.92 * 10 ^ 18 + 311039415000000000000000000 / 2   = 346630818420000000000000000
        // accounts[0] 23898600000000000000000 + 311039415000000000000000000 / 4 = 77783752350000000000000000
        // accounts[1] 47797200000000000000000 + 311039415000000000000000000 / 4 = 77807650950000000000000000
        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('77783752350000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('77807650950000000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('346630818420000000000000000').valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('71695800000000000000000').valueOf(),
                soldTokens: new BigNumber('71695800000000000000000').valueOf(),
                collectedEthers: new BigNumber('2').mul(precision).valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

    });

    it("check airdrop 2", async function () {
        const {howdoo, ico} = await deploy();

        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
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

        await ico.sendTransaction({value:  new BigNumber('1').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);

        await ico.sendTransaction({value:  new BigNumber('1').mul(precision).valueOf(), from: accounts[1]})
            .then(Utils.receiptShouldSucceed);

        await ico.mint(accounts[1], new BigNumber('23898600000000000000000').valueOf(), {from: accounts[8]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.mint(accounts[1], new BigNumber('23898600000000000000000').valueOf())
            .then(Utils.receiptShouldSucceed);

        await ico.mint(accounts[2], new BigNumber('23898600000000000000000').valueOf())
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('23898600000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('47797200000000000000000').valueOf()},
                    {[accounts[2]]: new BigNumber('23898600000000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('191111110.92').mul(precision).valueOf()},
                ],
            },
            ico: {
                airdropPointer: 0,
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
                soldTokens: new BigNumber('95594400000000000000000').valueOf(),
                collectedEthers: new BigNumber('2').mul(precision).valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

        await ico.testChangeICOPeriod(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 - 3600));

        await ico.airdrop(100, {from: bountyAddress})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.airdrop(1)
            .then(Utils.receiptShouldSucceed);

        // 311111110.8 * 10 ^ 18 - 95594400000000000000000 = 311015516400000000000000000
        // hisAccount 191111110.92 * 10 ^ 18 + 311015516400000000000000000 / 2   = 346618869120000000000000000
        // accounts[0] 23898600000000000000000 + 51835919400000000000000000      = 51859818000000000000000000
        // accounts[1] 47797200000000000000000 + 51835919400000000000000000      = 51883716600000000000000000
        // accounts[2] 23898600000000000000000 + 51835919400000000000000000      = 51859818000000000000000000
        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('51859818000000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('47797200000000000000000').valueOf()},
                    {[accounts[2]]: new BigNumber('23898600000000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('346618869120000000000000000').valueOf()},
                ],
            },
            ico: {
                airdropPointer: 1,
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('95594400000000000000000').valueOf(),
                soldTokens: new BigNumber('95594400000000000000000').valueOf(),
                collectedEthers: new BigNumber('2').mul(precision).valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

        await ico.airdrop(0)
            .then(Utils.receiptShouldSucceed);

        // 311111110.8 * 10 ^ 18 - 95594400000000000000000 = 311015516400000000000000000
        // hisAccount 191111110.92 * 10 ^ 18 + 311015516400000000000000000 / 2   = 346618869120000000000000000
        // accounts[0] 23898600000000000000000 + 51835919400000000000000000      = 51859818000000000000000000
        // accounts[1] 47797200000000000000000 + 51835919400000000000000000      = 51883716600000000000000000
        // accounts[2] 23898600000000000000000 + 51835919400000000000000000      = 51859818000000000000000000
        await Utils.checkState({ico, howdoo}, {
            ico: {
                airdropPointer: 1,
            },
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('51859818000000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('47797200000000000000000').valueOf()},
                    {[accounts[2]]: new BigNumber('23898600000000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('346618869120000000000000000').valueOf()},
                ],
            },
        });

        await ico.airdrop(1)
            .then(Utils.receiptShouldSucceed);

        // 311111110.8 * 10 ^ 18 - 95594400000000000000000 = 311015516400000000000000000
        // hisAccount 191111110.92 * 10 ^ 18 + 311015516400000000000000000 / 2   = 346618869120000000000000000
        // accounts[0] 23898600000000000000000 + 51835919400000000000000000      = 51859818000000000000000000
        // accounts[1] 47797200000000000000000 + 51835919400000000000000000      = 51883716600000000000000000
        // accounts[2] 23898600000000000000000 + 51835919400000000000000000      = 51859818000000000000000000
        await Utils.checkState({ico, howdoo}, {
            ico: {
                airdropPointer: 2,
            },
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('51859818000000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('51883716600000000000000000').valueOf()},
                    {[accounts[2]]: new BigNumber('23898600000000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('346618869120000000000000000').valueOf()},
                ],
            },
        });

        await ico.airdrop(1)
            .then(Utils.receiptShouldSucceed);

        // 311111110.8 * 10 ^ 18 - 95594400000000000000000 = 311015516400000000000000000
        // hisAccount 191111110.92 * 10 ^ 18 + 311015516400000000000000000 / 2   = 346618869120000000000000000
        // accounts[0] 23898600000000000000000 + 51835919400000000000000000      = 51859818000000000000000000
        // accounts[1] 47797200000000000000000 + 51835919400000000000000000      = 51883716600000000000000000
        // accounts[2] 23898600000000000000000 + 51835919400000000000000000      = 51859818000000000000000000
        await Utils.checkState({ico, howdoo}, {
            ico: {
                airdropPointer: 3,
            },
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('51859818000000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('51883716600000000000000000').valueOf()},
                    {[accounts[2]]: new BigNumber('51859818000000000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('346618869120000000000000000').valueOf()},
                ],
            },
        });

    });

    it('check whitelisting', async function() {
        const {howdoo, ico} = await deploy();
        await ico.updateWhitelist(web3.eth.accounts[0], false);
        await ico.updateWhitelist(web3.eth.accounts[1], false);
        let other = accounts[5];
        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
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

        await ico.updateWhitelist(other, true);
        assert.equal(await ico.whitelist.call(other).valueOf(), true, 'whitelist isn\'t equal');

        other = accounts[1];
        await ico.updateWhitelist(other, true,{from:other})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        assert.equal(await ico.whitelist.call(other).valueOf(),false, 'whitelist isn\'t equal');
        await ico.updateWhitelist(other, true);
        assert.isTrue(await ico.whitelist.call(other).valueOf() == true);
        await ico.updateWhitelist(other, false, {from:other})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        assert.isTrue(await ico.whitelist.call(other).valueOf() == true);
        await ico.updateWhitelist(other, false)
        assert.isTrue(await ico.whitelist.call(other).valueOf() == false);
    });

    it('check transaction through whitelisting', async function() {
        const {howdoo, ico} = await deploy();
        await ico.updateWhitelist(web3.eth.accounts[0], false);
        await ico.updateWhitelist(web3.eth.accounts[1], false);

        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
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

        await ico.sendTransaction({value: new BigNumber('1').mul(precision)})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.updateWhitelist(accounts[0], true);
        await ico.updateWhitelist(accounts[1], true);

        //10 ^ 18 * 119493000 / 10000 * 125/100 = 17923950000000000000000
        await ico.sendTransaction({value: new BigNumber('1').mul(precision)})
            .then(Utils.receiptShouldSucceed);
        await ico.sendTransaction({value: new BigNumber('2').mul(precision), from: accounts[1]})
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('23898600000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('47797200000000000000000').valueOf()},
                ],
            }
        });
    });

    it("check multivestBuyKYC", async function () {
        const {howdoo, ico} = await deploy();
        await ico.updateWhitelist(web3.eth.accounts[0], false);
        await ico.updateWhitelist(web3.eth.accounts[1], false);

        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
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

        await makeTransactionKYC(ico, wrongSigAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await makeTransactionKYC(ico, signAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('23898600000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
                soldTokens: new BigNumber('23898600000000000000000').valueOf(),
                collectedEthers: new BigNumber('1').mul(precision).valueOf(),
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

    });
*/
    it("check getStats", async function () {
        const {howdoo, ico} = await deploy();

        let stats = await ico.getStats();
        console.log(stats);
        assert.equal(await stats[0], new BigNumber(icoSince).valueOf(), "startTime is not equal");
        assert.equal(await stats[1], new BigNumber(icoTill).valueOf(), "endTime is not equal");
        assert.equal(await stats[2], new BigNumber('0').mul(precision).valueOf(), "soldTokens is not equal");
        assert.equal(await stats[3], new BigNumber('311111110.8').mul(precision).valueOf(), "maxTokenSupply is not equal");
        assert.equal(await stats[4], new BigNumber('23898600000000000000000').valueOf(), "tokensPerEth is not equal");
        assert.equal(await stats[5], new BigNumber(5000).valueOf(), "tierPrice is not equal");
        assert.equal(await stats[6], new BigNumber('44444444.4').mul(precision).valueOf(), "tierMaxAmount is not equal");

        await ico.testChangeSoldTokens(new BigNumber('44444444.5').mul(precision).valueOf());
        await ico.testChangeICOPeriod(28, 82);

        stats = await ico.getStats();
        assert.equal(await stats[0], new BigNumber(28).valueOf(), "startTime is not equal");
        assert.equal(await stats[1], new BigNumber(82).valueOf(), "endTime is not equal");
        assert.equal(await stats[2], new BigNumber('44444444.5').mul(precision).valueOf(), "soldTokens is not equal");
        assert.equal(await stats[3], new BigNumber('311111110.8').mul(precision).valueOf(), "maxTokenSupply is not equal");
        assert.equal(await stats[4], new BigNumber('14936625000000000000000').valueOf(), "tokensPerEth is not equal");
        assert.equal(await stats[5], new BigNumber(8000).valueOf(), "tierPrice is not equal");
        assert.equal(await stats[6], new BigNumber('177777777.6').mul(precision).valueOf(), "tierMaxAmount is not equal");
    });

});