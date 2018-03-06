pragma solidity 0.4.19;


import "../HowdooAllocation.sol";


contract TestHowdooAllocation is HowdooAllocation {

    function TestHowdooAllocation(
        address _howdoo,
        address _ico
    ) public HowdooAllocation(
        _howdoo,
        _ico
    ) {}

    function testGetAllocationsLength() public view returns (uint256) {
        return allocations.length;
    }

    function testGetAllocationById(uint256 _id) public view returns(address, uint256, bool) {
        return (allocations[_id].holderAddress, allocations[_id].amount, allocations[_id].sent);
    }

    function testGetVestingsLength() public view returns (uint256) {
        return team.length;
    }

    function testGetVestingById(uint256 _id) public view returns(uint256, uint256, uint256, uint256, address) {
        return (
            team[_id].period,
            team[_id].cliff,
            team[_id].cliffAmount,
            team[_id].allocationTime,
            team[_id].holderAddress
        );
    }

    function testClaim(uint256 _currentTime) public {
        allocateInternal(msg.sender, _currentTime);
    }

    function testAllocate(uint256 _currentTime) public onlyOwner {
        allocateInternal(address(0), _currentTime);
    }

    function testSetAllocation(address[] _addresses) public {

        allocations.push(Allocation(
            _addresses[0],
            uint(10121066657).mul(uint(10) ** uint(DECIMALS - 2)),
            false
        ));
        uint256 startTime = ico.startTime();
        team.push(TeamsAllocation(
            12,
            3,
            uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            _addresses[1]
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(7777777775).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            _addresses[2]
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(194444445).mul(uint(10) ** uint(DECIMALS - 3)),
            startTime,
            _addresses[3]
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            _addresses[4]
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(22469135833333333333333),
            startTime,
            _addresses[5]
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(26790123333333333333333),
            startTime,
            _addresses[6]
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(4148148055555555555555),
            startTime,
            _addresses[7]
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(2666666675).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            _addresses[8]
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(1555555554).mul(uint(10) ** uint(DECIMALS - 2)),
            startTime,
            _addresses[9]
        ));
    }

}