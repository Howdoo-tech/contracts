var ICO = artifacts.require("./test/TestICO.sol"),
    Howdoo = artifacts.require("./test/TestHowdoo.sol"),
    Allocations = artifacts.require("./test/TestHowdooAllocation.sol"),

    Utils = require("./utils"),
    BigNumber = require('bignumber.js'),

    precision = new BigNumber("1000000000000000000"),
    icoSince = parseInt(new Date().getTime() / 1000) - 3600,
    icoTill = parseInt(new Date().getTime() / 1000) + 3600,
    monthSeconds = 2629744,

    treasuryAddress = web3.eth.accounts[8],
    hisAddress = web3.eth.accounts[8],
    bountyAddress = web3.eth.accounts[8],
    allowedAddress = web3.eth.accounts[8],
    multivestAddress = web3.eth.accounts[8],
    etherHolder = web3.eth.accounts[9];

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

    const allocation = await Allocations.new(
        howdoo.address,
        ico.address
    );

    await howdoo.addMinter(ico.address);
    await howdoo.addMinter(allocation.address);
    await howdoo.setICO(ico.address);
    await allocation.setICO(ico.address);

    await howdoo.setAllowedAddress(allowedAddress);

    return {howdoo, ico, allocation};
}

contract('Allocations + vesting allocation', function (accounts) {

    it('deploy & check constructor info & setHowdoo & setICO', async function () {
        const {howdoo, ico, allocation} = await deploy();

        await Utils.checkState({allocation}, {
            allocation: {
                howdoo: howdoo.address,
                ico: ico.address
            }
        });

        await allocation.setHowdoo(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocation.setHowdoo(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocation.setHowdoo(accounts[2])
            .then(Utils.receiptShouldSucceed);

        await allocation.setICO(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocation.setICO(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocation.setICO(accounts[2])
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({allocation}, {
            allocation: {
                howdoo: accounts[2],
                ico: accounts[2]
            }
        });
    });

    it('check Allocation & claim & allocate', async function () {
        const {howdoo, ico, allocation} = await deploy();

        await ico.changePreICODates(icoSince, icoTill);
        await Utils.checkState({allocation}, {
            allocation: {
                howdoo: howdoo.address,
                ico: ico.address
            }
        });

        allocation.testSetAllocation([
            accounts[0],
            accounts[1],
            accounts[2],
            accounts[3],
            accounts[4],
            accounts[5],
            accounts[6],
            accounts[7],
            accounts[8],
            accounts[9],
        ]);

        assert.equal(await allocation.testGetAllocationsLength.call(), 1, "AllocationsLength is not equal");

        let allocationData = await allocation.testGetAllocationById.call(0);
        assert.equal(allocationData[0], accounts[0], "allocationData address is not equal");
        assert.equal(allocationData[1], new BigNumber('101210666.57').mul(precision).valueOf(), "allocationData tokens is not equal");
        assert.equal(allocationData[2], false, "allocationData sent is not equal");
        /*
                await allocation.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
                    accounts[0],
                    accounts[1],
                    accounts[2],
                ], {from: accounts[5]})
                    .then(Utils.receiptShouldFailed)
                    .catch(Utils.catchReceiptShouldFailed);

                await allocation.setAllocation(new BigNumber('0').mul(precision).valueOf(),[
                    accounts[0],
                    accounts[1],
                    accounts[2],
                ])
                    .then(Utils.receiptShouldFailed)
                    .catch(Utils.catchReceiptShouldFailed);

                await allocation.testChangeRemainingTokens(0);
                await allocation.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
                    accounts[0],
                    accounts[1],
                    accounts[2],
                ])
                    .then(Utils.receiptShouldFailed)
                    .catch(Utils.catchReceiptShouldFailed);
                await allocation.testChangeRemainingTokens(new BigNumber('88888888.8').mul(precision).valueOf());

                await allocation.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[])
                    .then(Utils.receiptShouldFailed)
                    .catch(Utils.catchReceiptShouldFailed);

                await allocation.testChangeRemainingTokens(new BigNumber('1').valueOf());
                await allocation.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
                    accounts[0],
                    accounts[1],
                    accounts[2],
                ])
                    .then(Utils.receiptShouldFailed)
                    .catch(Utils.catchReceiptShouldFailed);
                await allocation.testChangeRemainingTokens(new BigNumber('88888888.8').mul(precision).valueOf());

                await allocation.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
                    accounts[0],
                    0x0,
                    accounts[2],
                ])
                    .then(Utils.receiptShouldFailed)
                    .catch(Utils.catchReceiptShouldFailed);

                await allocation.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
                    accounts[1],
                    accounts[2],
                    accounts[3],
                ])
                    .then(Utils.receiptShouldSucceed);

                await allocation.claim({from: accounts[2]})
                    .then(Utils.receiptShouldSucceed);

                allocationData = await allocation.testGetAllocationById.call(0);
                assert.equal(allocationData[2], false, "allocationData sent is not equal");
                allocationData = await allocation.testGetAllocationById.call(1);
                assert.equal(allocationData[2], false, "allocationData sent is not equal");
                allocationData = await allocation.testGetAllocationById.call(2);
                assert.equal(allocationData[2], true, "allocationData sent is not equal");
                allocationData = await allocation.testGetAllocationById.call(3);
                assert.equal(allocationData[2], false, "allocationData sent is not equal");

                await Utils.checkState({allocation, howdoo}, {
                    allocation: {
                        howdoo: howdoo.address,
                        ico: ico.address,
                        remainingTokens: new BigNumber('88888888.8').mul(precision).sub(new BigNumber('30000').mul(precision)).valueOf()
                    },
                    howdoo: {
                        balanceOf: [
                            {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                            {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                            {[accounts[2]]: new BigNumber('10000').mul(precision).valueOf()},
                            {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                        ],
                    }
                });

                await allocation.claim({from: accounts[2]})
                    .then(Utils.receiptShouldSucceed);

                await Utils.checkState({allocation, howdoo}, {
                    allocation: {
                        howdoo: howdoo.address,
                        ico: ico.address,
                        remainingTokens: new BigNumber('88888888.8').mul(precision).sub(new BigNumber('30000').mul(precision)).valueOf()
                    },
                    howdoo: {
                        balanceOf: [
                            {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                            {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                            {[accounts[2]]: new BigNumber('10000').mul(precision).valueOf()},
                            {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                        ],
                    }
                });
        */

        await allocation.allocate({from: accounts[2]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await allocation.allocate()
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({allocation, howdoo}, {
            allocation: {
                howdoo: howdoo.address,
                ico: ico.address,
            },
            howdoo: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('101210666.57').mul(precision).valueOf()},
                    // {[accounts[1]]: new BigNumber('10000').mul(precision).valueOf()},
                    // {[accounts[2]]: new BigNumber('10000').mul(precision).valueOf()},
                    // {[accounts[3]]: new BigNumber('10000').mul(precision).valueOf()},
                ],
            }
        });

        allocationData = await allocation.testGetAllocationById.call(0);
        assert.equal(allocationData[2], true, "allocationData sent is not equal");

        // allocationData = await allocation.testGetAllocationById.call(1);
        // assert.equal(allocationData[2], true, "allocationData sent is not equal");
        // allocationData = await allocation.testGetAllocationById.call(2);
        // assert.equal(allocationData[2], true, "allocationData sent is not equal");
        // allocationData = await allocation.testGetAllocationById.call(3);
        // assert.equal(allocationData[2], true, "allocationData sent is not equal");
    });

    it('check vesting allocations', async function () {
        const {howdoo, ico, allocation} = await deploy();

        await ico.changePreICODates(icoSince, icoTill);
        allocation.testSetAllocation([
            accounts[0],
            accounts[1],
            accounts[2],
            accounts[3],
            accounts[4],
            accounts[5],
            accounts[6],
            accounts[7],
            accounts[8],
            accounts[9],
        ]);

        await Utils.checkState({allocation, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[4]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[5]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[6]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[7]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[8]]: new BigNumber('378888888.52').mul(precision).valueOf()},
                    {[accounts[9]]: new BigNumber('0').mul(precision).valueOf()},
                ],
            }
        });

        allocation.allocate()
            .then(Utils.receiptShouldSucceed);
        await Utils.checkState({allocation, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[4]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[5]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[6]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[7]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[8]]: new BigNumber('378888888.52').mul(precision).valueOf()},
                    {[accounts[9]]: new BigNumber('0').mul(precision).valueOf()},
                ],
            }
        });

        allocation.testAllocate(parseInt(new Date().getTime() / 1000) + monthSeconds - 100000)
            .then(Utils.receiptShouldSucceed);
        await Utils.checkState({allocation, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[4]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[5]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[6]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[7]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[8]]: new BigNumber('378888888.52').mul(precision).valueOf()},
                    {[accounts[9]]: new BigNumber('0').mul(precision).valueOf()},
                ],
            }
        });

        await ico.changePreICODates(icoSince - monthSeconds, icoTill);
        allocation.testAllocate(parseInt(new Date().getTime() / 1000) + monthSeconds)
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({allocation, howdoo}, {
            howdoo: {
                balanceOf: [
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[4]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[5]]: new BigNumber('22469135833333333333333').valueOf()},
                    {[accounts[6]]: new BigNumber('26790123333333333333333').valueOf()},
                    {[accounts[7]]: new BigNumber('4148148055555555555555').valueOf()},
                    {[accounts[8]]: new BigNumber('378888888.52').mul(precision).valueOf()},
                    {[accounts[9]]: new BigNumber('0').mul(precision).valueOf()},
                ],
            }
        });

    });

});