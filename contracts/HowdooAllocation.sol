pragma solidity 0.4.19;

import "./Ownable.sol";
import "./Howdoo.sol";
import "./SafeMath.sol";
import "./ICO.sol";


contract HowdooAllocation is Ownable {

    using SafeMath for uint256;

    uint256 public constant DECIMALS = 18;

    uint256 public constant MONTH_SECONDS = 2629744;

    Allocation[] public allocations;

    TeamsAllocation[] public team;

    Howdoo public howdoo;

    ICO public ico;

    struct Allocation {
        address holderAddress;
        uint256 amount;
        bool sent;
    }

    struct TeamsAllocation {
        uint256 period;
        uint256 cliff;
        uint256 cliffAmount;
        uint256 allocationTime;
        address holderAddress;
    }

    function HowdooAllocation(
        address _howdoo,
        address _ico
    ) public {
        require(_howdoo != address(0) && _ico != address(0));
        howdoo = Howdoo(_howdoo);
        ico = ICO(_ico);
    }

    function setHowdoo(address _howdoo) public onlyOwner {
        require(_howdoo != address(0));
        howdoo = Howdoo(_howdoo);
    }

    function setICO(address _ico) public onlyOwner {
        require(_ico != address(0));
        ico = ICO(_ico);
    }

    function claim() public {
        allocateInternal(msg.sender, now);
    }

    function allocate() public onlyOwner {
        allocateInternal(address(0), now);
    }

    function setAllocation() public onlyOwner {
        allocations.push(Allocation(
        0x627306090abab3a6e1400e9345bc60c78a8bef57,
        uint(10121066657).mul(uint(10) ** uint(DECIMALS - 2)),
        false
        ));
        uint256 startTime = ico.startTime();
        team.push(TeamsAllocation(
        12,
        3,
        uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
        startTime,
        0xf17f52151ebef6c7334fad080c5704d77216b732
        ));
        team.push(TeamsAllocation(
        12,
        3,
        uint(7777777775).mul(uint(10) ** uint(DECIMALS - 4)),
        startTime,
        0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef
        ));
        team.push(TeamsAllocation(
        12,
        3,
        uint(194444445).mul(uint(10) ** uint(DECIMALS - 3)),
        startTime,
        0x821aea9a577a9b44299b9c15c88cf3087f3b5544
        ));
        team.push(TeamsAllocation(
        12,
        3,
        uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
        startTime,
        0x0d1d4e623d10f9fba5db95830f7d3839406c6af2
        ));
        team.push(TeamsAllocation(
        36,
        1,
        uint(22469135833333333333333),
        startTime,
        0x2932b7a2355d6fecc4b5c0b6bd44cc31df247a2e
        ));
        team.push(TeamsAllocation(
        36,
        1,
        uint(26790123333333333333333),
        startTime,
        0x2191ef87e392377ec08e7c08eb105ef5448eced5
        ));
        team.push(TeamsAllocation(
        36,
        1,
        uint(4148148055555555555555),
        startTime,
        0x0f4f2ac550a1b4e2280d04c21cea7ebd822934b5
        ));
        team.push(TeamsAllocation(
        12,
        3,
        uint(2666666675).mul(uint(10) ** uint(DECIMALS - 4)),
        startTime,
        0x6330a553fc93768f612722bb8c2ec78ac90b3bbc
        ));
        team.push(TeamsAllocation(
        12,
        3,
        uint(1555555554).mul(uint(10) ** uint(DECIMALS - 2)),
        startTime,
        0x5aeda56215b167893e80b4fe645ba6d5bab767de
        ));
    }

    function allocateInternal(address _holder, uint256 _currentTime) internal {

        for (uint256 i = 0; i < allocations.length; i++) {
            if (_holder != address(0) && allocations[i].holderAddress != _holder) {
                continue;
            }
            if (true == allocations[i].sent) {
                continue;
            }
            Allocation storage allocation = allocations[i];
            allocation.sent = true;

            require(allocation.amount == howdoo.mint(allocation.holderAddress, allocation.amount));
        }

        for (uint256 j = 0; j < team.length; j++) {
            TeamsAllocation storage member = team[j];
            if (_holder != address(0) && member.holderAddress != _holder) {
                continue;
            }

            uint256 periods = _currentTime.sub(member.allocationTime).div(member.cliff.mul(MONTH_SECONDS));
            if (periods < 1) {
                continue;
            }

            uint256 allocatedPeriods = member.allocationTime.sub(ico.startTime()).div(member.cliff.mul(MONTH_SECONDS));
            if (periods.add(allocatedPeriods) > member.period.div(member.cliff)) {
                periods = member.period.div(member.cliff).sub(allocatedPeriods);
            }

            uint256 minted = howdoo.mint(member.holderAddress, member.cliffAmount.mul(periods));

            require(minted == member.cliffAmount.mul(periods));
            member.allocationTime = member.allocationTime.add(member.cliff.mul(MONTH_SECONDS).mul(periods));
        }
    }

}