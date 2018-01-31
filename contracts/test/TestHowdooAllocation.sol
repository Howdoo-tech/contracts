pragma solidity 0.4.18;


import "../HowdooAllocation.sol";


contract TestHowdooAllocation is HowdooAllocation {

    function TestHowdooAllocation(
        address _howdoo,
        address _ico
    ) public HowdooAllocation(
        _howdoo,
        _ico
    ) {}

    function testChangeRemainingTokens(uint256 _remainingTokens) public returns (uint256) {
        remainingTokens = _remainingTokens;
    }

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
        allocateInternal(msg.sender, now);
    }

    function testAllocate(uint256 _currentTime) public onlyOwner {
        allocateInternal(address(0), _currentTime);
    }


}