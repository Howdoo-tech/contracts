var ICO = artifacts.require("./test/TestICO.sol"),
    Howdoo = artifacts.require("./test/TestHowdoo.sol"),
    Referral = artifacts.require("./Referral.sol"),

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

async function makeTransaction(instance, sign, address, amount) {
    'use strict';
    var h = abi.soliditySHA3(['address', 'uint256'], [new BN(address.substr(2), 16), amount]),
        sig = web3.eth.sign(sign, h.toString('hex')).slice(2),
        r = `0x${sig.slice(0, 64)}`,
        s = `0x${sig.slice(64, 128)}`,
        v = web3.toDecimal(sig.slice(128, 130)) + 27;

    var data = abi.simpleEncode('multivestMint(address,uint256,uint8,bytes32,bytes32)', address, amount, v, r, s);

    return instance.sendTransaction({from: address, data: data.toString('hex')});
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
    const ref = await Referral.new(
        howdoo.address,
        multivestAddress,
    );
    await howdoo.addMinter(ico.address);
    await howdoo.addMinter(ref.address);
    await howdoo.setICO(ico.address);

    return {howdoo, ico, ref};
}

contract('Referral', function (accounts) {

    it("deploy & multivestMint", async function () {
        const {howdoo, ico, ref} = await deploy();

        await Utils.checkState({ico, howdoo, ref}, {
            ref: {
                totalSupply: new BigNumber('21111111.08').mul(precision).valueOf()
            },
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

        await makeTransaction(ref, wrongSigAddress, accounts[1], new BigNumber('1000').valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await makeTransaction(ref, signAddress, accounts[1], new BigNumber('1000').valueOf())
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({ico, howdoo, ref}, {
            ref: {
                totalSupply: new BigNumber('21111111.08').sub('1000').mul(precision).valueOf()
            },
            howdoo: {
                balanceOf: [
                    {[accounts[1]]: new BigNumber('1000').mul(precision).valueOf()},
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                ],
            },
            ico: {
                minInvest: new BigNumber('25000000').valueOf(),
                howdoo: howdoo.address,
                maxTokenSupply: new BigNumber('311111110.8').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').valueOf(),
                collectedEthers: new BigNumber('0').mul(precision).valueOf(),
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