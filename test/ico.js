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
        new BigNumber('311111110.8').mul(precision).valueOf(),//_maxTokenSupply
    );

    await howdoo.addMinter(ico.address);
    await howdoo.setICO(ico.address);
    await howdoo.setAllowedAddress(allowedAddress);

    // await howdoo.addMinter(privateSale.address);
    // await howdoo.setICO(privateSale.address);

    return {howdoo, ico, privateSale};
}

contract('ICO', function (accounts) {

    it("deploy & check constructor info & changeMinInvest & setHowdoo & setEtherHolder & setICO & getMinEthersInvestment", async function () {
        const {howdoo, ico} = await deploy();

        assert.equal(await ico.getMinEthersInvestment.call(), new BigNumber('209217276325809880').valueOf(), "value is not equal");

        await ico.changeMinInvest(new BigNumber('28000000').valueOf(), {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await ico.changeMinInvest(new BigNumber('28000000').valueOf())
            .then(Utils.receiptShouldSucceed);

        assert.equal(await ico.getMinEthersInvestment.call(), new BigNumber('234323349484907065').valueOf(), "value is not equal");

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

        await ico.setPrivateSale(accounts[3], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await ico.setPrivateSale(accounts[3])
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico}, {
            ico: {
                minInvest: new BigNumber('28000000').valueOf(),
                howdoo: accounts[2],
                privateSale: accounts[3],
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

        await ico.changePreICODates(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 + 3600));
        await ico.changeICODates(parseInt(new Date().getTime() / 1000 + 7200), parseInt(new Date().getTime() / 1000 + 3600 * 2));
        //check preICO
        //1 token = 1 ether * etherInUsd / tier.price
        //10 ^ 18 * 119493000 / 8000 = 14936625000000000000000
        assert.equal(await ico.testCalculateTokensAmount.call(
            new BigNumber('1').mul(precision).valueOf(),
            new BigNumber('0').valueOf()
        ), new BigNumber('14936625000000000000000').valueOf(), "value is not equal");

        assert.equal(await ico.testCalculateTokensAmount.call(
            new BigNumber('1').mul(precision).valueOf(),
            new BigNumber('133333333').mul(precision).valueOf()
        ), new BigNumber('0').valueOf(), "value is not equal");

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
        //209217276325809880 * 119493000 / 8000 = 3124999999999999998855
        assert.equal(await ico.testCalculateTokensAmount.call(
            new BigNumber('209217276325809880').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('3124999999999999998855').valueOf(), "value is not equal");

        await ico.changePreICODates(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 - 3600));

        // assert.equal(await ico.testCalculateTokensAmount.call(
        //     new BigNumber('1').mul(precision).valueOf(),
        //     new BigNumber('0').mul(precision).valueOf()
        // ), new BigNumber('0').valueOf(), "value is not equal");
        //check preICO END


        //check ICO
        await ico.changeICODates(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 + 3600 * 2));
        //1 token = 1 ether * etherInUsd / tier.price
        //10 ^ 18 * 119493000 / 9000 = 13277000000000000000000
        //(10 ^ 18 * (9000 * 1000)) / 119493000 = 75318219477291556.8275965956164796
        //((10 ^ 18) - 75318219477291556) * 119493000 / 10000 = 11049300000000000009889.2
        //11049300000000000009889 + 1000 * 10 ^ 18 = 12049300000000000009889
        assert.equal(await ico.testCalculateTokensAmount.call(
            new BigNumber('1').mul(precision).valueOf(),
            new BigNumber('222221222').mul(precision).valueOf()
        ), new BigNumber('12049300000000000009889').valueOf(), "value is not equal");

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
        //209217276325809880 * 119493000 / 9000 = 4999999999999999998168
        assert.equal(await ico.testCalculateTokensAmount.call(
            new BigNumber('209217276325809880').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('2777777777777777776760').valueOf(), "value is not equal");

        let ethBalanceEtherHolder = await Utils.getEtherBalance(etherHolder).valueOf();

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico, howdoo}, {
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
                soldTokens: new BigNumber('13277000000000000000000').valueOf(),
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
                    {[accounts[0]]: new BigNumber('13277000000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            }
        });

        await Utils.checkEtherBalance(etherHolder, new BigNumber('1').mul(precision).add(ethBalanceEtherHolder).valueOf());
    });

    it("check calculateEthersAmount & minInvest & buyTokens & check ethers", async function () {
        const {howdoo, ico} = await deploy();

        await Utils.checkState({ico}, {
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
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
        await ico.changePreICODates(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 + 3600));
        await ico.changeICODates(parseInt(new Date().getTime() / 1000 + 7200), parseInt(new Date().getTime() / 1000 + 3600 * 2));
        //check preICO
        //1 token = 1 ether * etherInUsd / tier.price
        //10 ^ 18 * 119493000 / 8000 = 14936625000000000000000
        assert.equal(await ico.testCalculateEthersAmount.call(
            new BigNumber('14936625000000000000000').valueOf(),
            new BigNumber('0').valueOf()
        ), new BigNumber('1000000000000000000').valueOf(), "value is not equal");

        assert.equal(await ico.testCalculateEthersAmount.call(
            new BigNumber('14936625000000000000000').mul(precision).valueOf(),
            new BigNumber('133333333').mul(precision).valueOf()
        ), new BigNumber('0').valueOf(), "value is not equal");

        //check minInvest
        //250 usd | 1194.93usd
        //249 * 10 ^ 18 / 1194.93 = 208380407220506640.5563505812055936
        assert.equal(await ico.testCalculateEthersAmount.call(
            new BigNumber('3124999999999999998854').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('0').valueOf(), "value is not equal");

        //check minInvest
        //250 usd | 1194.93usd
        //250 * 10 ^ 18 / 1194.93 = 209217276325809880.0766572100457767
        //209217276325809880 * 119493000 / 8000 = 4999999999999999998168
        assert.equal(await ico.testCalculateEthersAmount.call(
            new BigNumber('3124999999999999998855').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('209217276325809880').valueOf(), "value is not equal");


        await ico.changePreICODates(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 - 3600));

        // assert.equal(await ico.testCalculateEthersAmount.call(
        //     new BigNumber('14936625000000000000000').mul(precision).valueOf(),
        //     new BigNumber('0').mul(precision).valueOf()
        // ), new BigNumber('0').valueOf(), "value is not equal");
        //check PreICO END

        await ico.changeICODates(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 + 3600 * 2));
        //check ICO
        //1 token = 1 ether * etherInUsd / tier.price
        //10 ^ 18 * 119493000 / 9000 = 13277000000000000000000
        //(10 ^ 18 * (9000 * 1000)) / 119493000 = 75318219477291556.8275965956164796
        //((10 ^ 18) - 75318219477291556) * 119493000 / 10000 = 11049300000000000009889.2
        //11049300000000000009889 + 1000 * 10 ^ 18 = 12049300000000000009889
        assert.equal(await ico.testCalculateEthersAmount.call(
            new BigNumber('12049300000000000009890').valueOf(),
            new BigNumber('222221222').mul(precision).valueOf()
        ), new BigNumber('1').mul(precision).valueOf(), "value is not equal");

        //check minInvest
        //250 usd | 1194.93usd
        //249 * 10 ^ 18 / 1194.93 = 208380407220506640.5563505812055936
        assert.equal(await ico.testCalculateEthersAmount.call(
            new BigNumber('2777777777777777776759').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('0').valueOf(), "value is not equal");

        //check minInvest
        //250 usd | 1194.93usd
        //250 * 10 ^ 18 / 1194.93 = 209217276325809880.0766572100457767
        //209217276325809880 * 119493000 / 9000 = 2777777777777777776760
        assert.equal(await ico.testCalculateEthersAmount.call(
            new BigNumber('2777777777777777776760').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('209217276325809880').valueOf(), "value is not equal");

        let ethBalanceEtherHolder = await Utils.getEtherBalance(etherHolder).valueOf();

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico, howdoo}, {
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
                soldTokens: new BigNumber('13277000000000000000000').valueOf(),
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
                    {[accounts[0]]: new BigNumber('13277000000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            }
        });

        await Utils.checkEtherBalance(etherHolder, new BigNumber('1').mul(precision).add(ethBalanceEtherHolder).valueOf());

    });

    it("check getStats", async function () {
        const {howdoo, ico, privateSale} = await deploy();
        let preICOStart = parseInt(new Date().getTime() / 1000) - 7200,
            preICOEnd = parseInt(new Date().getTime() / 1000) + 7200,
            ICOStart = parseInt(new Date().getTime() / 1000) + 7200 * 2,
            ICOEnd = parseInt(new Date().getTime() / 1000) + 7200 * 3;

        await ico.changePreICODates(preICOStart, preICOEnd);
        await ico.changeICODates(ICOStart, ICOEnd);

        let stats = await ico.getStats(new BigNumber('3').mul(precision).valueOf(), new BigNumber('2').mul(precision).valueOf());
        assert.equal(stats[0], new BigNumber(preICOStart).valueOf(), "startTime is not equal");
        assert.equal(stats[1], new BigNumber(ICOEnd).valueOf(), "endTime is not equal");
        assert.equal(stats[2], new BigNumber('0').mul(precision).valueOf(), "soldTokens is not equal");
        assert.equal(stats[3], new BigNumber('0').mul(precision).valueOf(), "totalsoldTokens is not equal");
        assert.equal(stats[4], new BigNumber('311111110.8').mul(precision).valueOf(), "maxTokenSupply is not equal");
        assert.equal(stats[5], new BigNumber('14936625000000000000000').valueOf(), "tokensPerEth is not equal");
        assert.equal(stats[6], new BigNumber('44809875000000000000000').valueOf(), "tokensPerBtc is not equal");
        assert.equal(stats[7], new BigNumber('29873250000000000000000').valueOf(), "tokensPerLtc is not equal");

        assert.equal(stats[8][0], new BigNumber('133333333.2').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[8][1], new BigNumber('8000').valueOf(), "price is not equal");
        assert.equal(stats[8][2], new BigNumber(preICOStart).valueOf(), "startTime is not equal");
        assert.equal(stats[8][3], new BigNumber(preICOEnd).valueOf(), "endTime is not equal");
        assert.equal(stats[8][4], new BigNumber('222222222').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[8][5], new BigNumber('9000').valueOf(), "price is not equal");
        assert.equal(stats[8][6], new BigNumber(ICOStart).valueOf(), "startTime is not equal");
        assert.equal(stats[8][7], new BigNumber(0).valueOf(), "endTime is not equal");
        assert.equal(stats[8][8], new BigNumber('266666666.4').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[8][9], new BigNumber('10000').valueOf(), "price is not equal");
        assert.equal(stats[8][10], new BigNumber(0).valueOf(), "startTime is not equal");
        assert.equal(stats[8][11], new BigNumber(ICOEnd).valueOf(), "endTime is not equal");

        preICOStart = parseInt(new Date().getTime() / 1000) - 7200 * 2;
        preICOEnd = parseInt(new Date().getTime() / 1000) - 7200;
        ICOStart = parseInt(new Date().getTime() / 1000) - 3600;
        ICOEnd = parseInt(new Date().getTime() / 1000) + 7200 * 3;
        await ico.changePreICODates(preICOStart, preICOEnd);
        await ico.changeICODates(ICOStart, ICOEnd);
        await ico.testChangeSoldTokens(new BigNumber('222222222').mul(precision).valueOf());
        await privateSale.testChangeSoldTokens(new BigNumber('28282828').mul(precision).valueOf());

        stats = await ico.getStats(new BigNumber('3').mul(precision).valueOf(), new BigNumber('2').mul(precision).valueOf());
        assert.equal(stats[3], new BigNumber('222222222').mul(precision).valueOf(), "totalsoldTokens is not equal");
        await ico.setPrivateSale(privateSale.address);
        stats = await ico.getStats(new BigNumber('3').mul(precision).valueOf(), new BigNumber('2').mul(precision).valueOf());

        assert.equal(stats[0], new BigNumber(preICOStart).valueOf(), "startTime is not equal");
        assert.equal(stats[1], new BigNumber(ICOEnd).valueOf(), "endTime is not equal");
        assert.equal(stats[2], new BigNumber('222222222').mul(precision).valueOf(), "soldTokens is not equal");
        assert.equal(stats[3], new BigNumber('222222222').add('28282828').mul(precision).valueOf(), "totalsoldTokens is not equal");
        assert.equal(stats[4], new BigNumber('311111110.8').mul(precision).valueOf(), "maxTokenSupply is not equal");
        assert.equal(stats[5], new BigNumber('11949300000000000000000').valueOf(), "tokensPerEth is not equal");
        assert.equal(stats[6], new BigNumber('35847900000000000000000').valueOf(), "tokensPerBtc is not equal");
        assert.equal(stats[7], new BigNumber('23898600000000000000000').valueOf(), "tokensPerLtc is not equal");

        assert.equal(stats[8][0], new BigNumber('133333333.2').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[8][1], new BigNumber('8000').valueOf(), "price is not equal");
        assert.equal(stats[8][2], new BigNumber(preICOStart).valueOf(), "startTime is not equal");
        assert.equal(stats[8][3], new BigNumber(preICOEnd).valueOf(), "endTime is not equal");
        assert.equal(stats[8][4], new BigNumber('222222222').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[8][5], new BigNumber('9000').valueOf(), "price is not equal");
        assert.equal(stats[8][6], new BigNumber(ICOStart).valueOf(), "startTime is not equal");
        assert.equal(stats[8][7], new BigNumber(0).valueOf(), "endTime is not equal");
        assert.equal(stats[8][8], new BigNumber('266666666.4').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[8][9], new BigNumber('10000').valueOf(), "price is not equal");
        assert.equal(stats[8][10], new BigNumber(0).valueOf(), "startTime is not equal");
        assert.equal(stats[8][11], new BigNumber(ICOEnd).valueOf(), "endTime is not equal");

    });

    it("setEtherInUSD & isPreICOActive & isICOFinished", async function () {
        const {howdoo, ico} = await deploy();

        await Utils.checkState({ico}, {
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
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

        //test isPreICOActive
        let stats = await ico.getStats(new BigNumber('3').mul(precision).valueOf(), new BigNumber('2').mul(precision).valueOf());

        assert.equal(await ico.isPreICOActive.call().valueOf(), false, "isPreICOActive not equal");

        assert.equal(stats[8][0], new BigNumber('133333333.2').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[8][1], new BigNumber('8000').valueOf(), "price is not equal");
        assert.equal(stats[8][2], new BigNumber(1522238340).valueOf(), "startTime is not equal");
        assert.equal(stats[8][3], new BigNumber(1524052740).valueOf(), "endTime is not equal");
        assert.equal(stats[8][4], new BigNumber('222222222').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[8][5], new BigNumber('9000').valueOf(), "price is not equal");
        assert.equal(stats[8][6], new BigNumber(1524916740).valueOf(), "startTime is not equal");
        assert.equal(stats[8][7], new BigNumber(0).valueOf(), "endTime is not equal");
        assert.equal(stats[8][8], new BigNumber('266666666.4').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[8][9], new BigNumber('10000').valueOf(), "price is not equal");
        assert.equal(stats[8][10], new BigNumber(0).valueOf(), "startTime is not equal");
        assert.equal(stats[8][11], new BigNumber(1527335940).valueOf(), "endTime is not equal");

        let preICOStart = parseInt(new Date().getTime() / 1000) - 7200,
            preICOEnd = parseInt(new Date().getTime() / 1000) + 7200,
            ICOStart = parseInt(new Date().getTime() / 1000) + 7200 * 2,
            ICOEnd = parseInt(new Date().getTime() / 1000) + 7200 * 3;

        await ico.changePreICODates(preICOStart, preICOEnd);
        await ico.changeICODates(ICOStart, ICOEnd);

        assert.equal(await ico.isPreICOActive.call().valueOf(), true, "isPreICOActive not equal");

        await ico.testChangeSoldTokens(new BigNumber('133333333.2').mul(precision).valueOf());

        assert.equal(await ico.isPreICOActive.call().valueOf(), false, "isPreICOActive not equal");

        await ico.testChangeSoldTokens(new BigNumber('33333333.2').mul(precision).valueOf());
        assert.equal(await ico.isPreICOActive.call().valueOf(), true, "isPreICOActive not equal");
        preICOEnd = parseInt(new Date().getTime() / 1000) - 3600;
        await ico.changePreICODates(preICOStart, preICOEnd);

        assert.equal(await ico.isPreICOActive.call().valueOf(), false, "isPreICOActive not equal");
        stats = await ico.getStats(new BigNumber('3').mul(precision).valueOf(), new BigNumber('2').mul(precision).valueOf());

        assert.equal(stats[8][0], new BigNumber('33333333.2').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[8][4], new BigNumber('222222222').add('100000000').mul(precision).valueOf(), "maxAmount is not equal");

        //test isICOFinished
        ICOStart = parseInt(new Date().getTime() / 1000) - 7200 * 2;
        ICOEnd = parseInt(new Date().getTime() / 1000) + 7200 * 3;

        assert.equal(await ico.isICOFinished.call().valueOf(), false, "isPreICOActive not equal");

        await ico.changeICODates(ICOStart, ICOEnd);
        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);
        assert.equal(await ico.isICOFinished.call().valueOf(), false, "isPreICOActive not equal");

        await ico.testChangeSoldTokens(new BigNumber('311111110.8').mul(precision).valueOf());
        assert.equal(await ico.isICOFinished.call().valueOf(), true, "isPreICOActive not equal");

        await ico.testChangeSoldTokens(new BigNumber('66666666.4').mul(precision).valueOf());
        assert.equal(await ico.isICOFinished.call().valueOf(), false, "isPreICOActive not equal");

        ICOStart = parseInt(new Date().getTime() / 1000) - 7200 * 3;
        ICOEnd = parseInt(new Date().getTime() / 1000) - 7200 * 2;
        await ico.changeICODates(ICOStart, ICOEnd);
        assert.equal(await ico.isICOFinished.call().valueOf(), true, "isPreICOActive not equal");
        await ico.isICOFinished();
        assert.equal(await ico.maxTokenSupply.call().valueOf(), new BigNumber('66666666.4').mul(precision).valueOf(), "maxTokenSupply not equal");
    });

    it("check multivestBuyKYC", async function () {
        const {howdoo, ico} = await deploy();

        await ico.changePreICODates(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 + 3600));
        await ico.changeICODates(parseInt(new Date().getTime() / 1000 + 7200), parseInt(new Date().getTime() / 1000 + 3600 * 2));

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
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
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

        await makeTransactionKYC(ico, wrongSigAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await makeTransactionKYC(ico, signAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('14936625000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
                soldTokens: new BigNumber('14936625000000000000000').valueOf(),
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

        await ico.changePreICODates(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 + 3600));
        await ico.changeICODates(parseInt(new Date().getTime() / 1000 + 7200), parseInt(new Date().getTime() / 1000 + 3600 * 2));

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[1]})
            .then(Utils.receiptShouldSucceed);

        await ico.mint(accounts[1], new BigNumber('14936625000000000000000').valueOf(), {from: accounts[8]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.mint(accounts[1], new BigNumber('14936625000000000000000').valueOf())
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('14936625000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('29873250000000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('191111110.92').mul(precision).valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
                soldTokens: new BigNumber('44809875000000000000000').valueOf(),
                collectedEthers: new BigNumber('2').mul(precision).valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

        await ico.changePreICODates(parseInt(new Date().getTime() / 1000 - 7200 * 2), parseInt(new Date().getTime() / 1000 - 3600 * 2));
        await ico.changeICODates(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 - 3600));

        await ico.airdrop(100, {from: bountyAddress})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        // await ico.airdrop(100)
        //     .then(Utils.receiptShouldSucceed);
        await ico.isICOFinished();

        // 311111110.8 * 10 ^ 18 - 44809875000000000000000 = 311066300925000000000000000
        // hisAccount 191111110.92 * 10 ^ 18 + 311066300925000000000000000 / 2   = 346644261382500000000000000
        // accounts[0] 14936625000000000000000 + 311066300925000000000000000 / 4 = 77781511856250000000000000
        // accounts[1] 29873250000000000000000 + 311066300925000000000000000 / 4 = 77796448481250000000000000
        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('77781511856250000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('77796448481250000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('346644261382500000000000000').valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('44809875000000000000000').valueOf(),
                soldTokens: new BigNumber('44809875000000000000000').valueOf(),
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

        await ico.changePreICODates(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 + 3600));
        await ico.changeICODates(parseInt(new Date().getTime() / 1000 + 7200), parseInt(new Date().getTime() / 1000 + 3600 * 2));

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[1]})
            .then(Utils.receiptShouldSucceed);

        await ico.mint(accounts[1], new BigNumber('14936625000000000000000').valueOf(), {from: accounts[8]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.mint(accounts[1], new BigNumber('14936625000000000000000').valueOf())
            .then(Utils.receiptShouldSucceed);

        await ico.mint(accounts[2], new BigNumber('14936625000000000000000').valueOf())
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('14936625000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('29873250000000000000000').valueOf()},
                    {[accounts[2]]: new BigNumber('14936625000000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('191111110.92').mul(precision).valueOf()},
                ],
            },
            ico: {
                airdropPointer: 0,
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
                soldTokens: new BigNumber('59746500000000000000000').valueOf(),
                collectedEthers: new BigNumber('2').mul(precision).valueOf(),
                etherPriceInUSD: new BigNumber('119493000').valueOf(),
                etherHolder: etherHolder,
                allowedMultivests: [
                    {[multivestAddress]: true},
                    {[bountyAddress]: false},
                ],
            }
        });

        await ico.changePreICODates(parseInt(new Date().getTime() / 1000 - 7200 * 2), parseInt(new Date().getTime() / 1000 - 3600 * 2));
        await ico.changeICODates(parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 - 3600));

        await ico.airdrop(100, {from: bountyAddress})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.airdrop(1)
            .then(Utils.receiptShouldSucceed);

        // 311111110.8 * 10 ^ 18 - 59746500000000000000000 = 311051364300000000000000000
        // hisAccount 191111110.92 * 10 ^ 18 + 311051364300000000000000000 / 2   = 346636793070000000000000000
        // accounts[0] 14936625000000000000000 + 51841894050000000000000000      = 51856830675000000000000000
        // accounts[1] 29873250000000000000000 + 51841894050000000000000000      = 51871767300000000000000000
        // accounts[2] 14936625000000000000000 + 51841894050000000000000000      = 51856830675000000000000000
        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('51856830675000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('29873250000000000000000').valueOf()},
                    {[accounts[2]]: new BigNumber('14936625000000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('346636793070000000000000000').valueOf()},
                ],
            },
            ico: {
                airdropPointer: 1,
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('59746500000000000000000').valueOf(),
                soldTokens: new BigNumber('59746500000000000000000').valueOf(),
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
        // hisAccount 191111110.92 * 10 ^ 18 + 311051364300000000000000000 / 2   = 346636793070000000000000000
        // accounts[0] 14936625000000000000000 + 51841894050000000000000000      = 51856830675000000000000000
        // accounts[1] 29873250000000000000000 + 51841894050000000000000000      = 51871767300000000000000000
        // accounts[2] 14936625000000000000000 + 51841894050000000000000000      = 51856830675000000000000000
        await Utils.checkState({ico, howdoo}, {
            ico: {
                airdropPointer: 1,
            },
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('51856830675000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('29873250000000000000000').valueOf()},
                    {[accounts[2]]: new BigNumber('14936625000000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('346636793070000000000000000').valueOf()},
                ],
            },
        });

        await ico.airdrop(1)
            .then(Utils.receiptShouldSucceed);

        // 311111110.8 * 10 ^ 18 - 95594400000000000000000 = 311015516400000000000000000
        // hisAccount 191111110.92 * 10 ^ 18 + 311051364300000000000000000 / 2   = 346636793070000000000000000
        // accounts[0] 14936625000000000000000 + 51841894050000000000000000      = 51856830675000000000000000
        // accounts[1] 29873250000000000000000 + 51841894050000000000000000      = 51871767300000000000000000
        // accounts[2] 14936625000000000000000 + 51841894050000000000000000      = 51856830675000000000000000
        await Utils.checkState({ico, howdoo}, {
            ico: {
                airdropPointer: 2,
            },
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('51856830675000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('51871767300000000000000000').valueOf()},
                    {[accounts[2]]: new BigNumber('14936625000000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('346636793070000000000000000').valueOf()},
                ],
            },
        });

        await ico.airdrop(1)
            .then(Utils.receiptShouldSucceed);

        // 311111110.8 * 10 ^ 18 - 95594400000000000000000 = 311015516400000000000000000
        // hisAccount 191111110.92 * 10 ^ 18 + 311051364300000000000000000 / 2   = 346636793070000000000000000
        // accounts[0] 14936625000000000000000 + 51841894050000000000000000      = 51856830675000000000000000
        // accounts[1] 29873250000000000000000 + 51841894050000000000000000      = 51871767300000000000000000
        // accounts[2] 14936625000000000000000 + 51841894050000000000000000      = 51856830675000000000000000
        await Utils.checkState({ico, howdoo}, {
            ico: {
                airdropPointer: 3,
            },
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('51856830675000000000000000').valueOf()},
                    {[accounts[1]]: new BigNumber('51871767300000000000000000').valueOf()},
                    {[accounts[2]]: new BigNumber('51856830675000000000000000').valueOf()},
                    {[hisAddress]: new BigNumber('346636793070000000000000000').valueOf()},
                ],
            },
        });

    });

});