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
        icoSince,// _startTime,
        icoTill, //_endTime,
        new BigNumber('119493000').valueOf(),//1,194.930008
        new BigNumber('25000000').valueOf(),//25000000
        new BigNumber('311111110.8').mul(precision).valueOf(),//_maxTokenSupply
    );

    await howdoo.addMinter(ico.address);
    await howdoo.setICO(ico.address);

    return {howdoo, ico};
}

contract('ICO', function (accounts) {

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
        //10 ^ 18 * 119493000 / 7000 = 17070428571428571428571.4285714285714286
        assert.equal(await ico.testCalculateTokensAmount.call(
            new BigNumber('1').mul(precision).valueOf(),
            new BigNumber('0').valueOf()
        ), new BigNumber('17070428571428571428571').valueOf(), "value is not equal");

        //1 token = 1 ether * etherInUsd / tier.price
        //10 ^ 18 * 119493000 / 7000 = 17070428571428571428571.4285714285714286 | 17070 tokens
        //(10 ^ 18 * (7000 * 1000)) / 119493000 = 58580837371226766.4214640188128175
        //((10 ^ 18) - 58580837371226766) * 119493000 / 9000 = 12499222222222222227818
        //13499222222222222227818
        assert.equal(await ico.testCalculateTokensAmount.call(
            new BigNumber('1').mul(precision).valueOf(),
            new BigNumber('44443444.4').mul(precision).valueOf()
        ), new BigNumber('13499222222222222227818').valueOf(), "value is not equal");

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
        //209217276325809880 * 119493000 / 7000 = 3571428571428571427262.8571428571428571
        assert.equal(await ico.testCalculateTokensAmount.call(
            new BigNumber('209217276325809880').valueOf(),
            new BigNumber('0').mul(precision).valueOf()
        ), new BigNumber('3571428571428571427262').valueOf(), "value is not equal");

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
                soldTokens: new BigNumber('17070428571428571428571').valueOf(),
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
                    {[accounts[0]]: new BigNumber('17070428571428571428571').valueOf()},
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

    it("check airdrop & mintInternal", async function () {
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

        await ico.mint(accounts[1], new BigNumber('17070428571428571428571').valueOf(), {from: accounts[8]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.mint(accounts[1], new BigNumber('17070428571428571428571').valueOf())
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('17070428571428571428571').valueOf()},
                    {[accounts[1]]: new BigNumber('34140857142857142857142').valueOf()},
                    {[hisAddress]: new BigNumber('167777777.6').mul(precision).valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
                soldTokens: new BigNumber('51211285714285714285713').valueOf(),
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

        await ico.airdrop({from: bountyAddress})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.airdrop()
            .then(Utils.receiptShouldSucceed);

        await ico.mint(accounts[1], new BigNumber('17070428571428571428571').valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        //311111110.8 * 10 ^ 18 - 51211285714285714285713 = 311059899514285714285714287
        //hisAccount 167777777.6 * 10 ^18 + 311059899514285714285714287 / 2     = 323307727357142857142857143.5
        //accounts[0] 17070428571428571428571 + 311059899514285714285714287 / 4 = 77782045307142857142857142.75
        //accounts[1] 34140857142857142857142 + 311059899514285714285714287 / 4 = 77799115735714285714285713.75
        await Utils.checkState({ico, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('77782045307142857142857142').valueOf()},
                    {[accounts[1]]: new BigNumber('77799115735714285714285713').valueOf()},
                    {[hisAddress]: new BigNumber('323307727357142857142857145').valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('51211285714285714285713').valueOf(),
                soldTokens: new BigNumber('51211285714285714285713').valueOf(),
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

});