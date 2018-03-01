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

        setAllocationInternal();
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

    function setAllocationInternal() internal {
        allocations.push(Allocation(
            0x61f2a1d40bc9e547f118ec3d838ed4b215e6772e,
            uint(10121066657).mul(uint(10) ** uint(DECIMALS - 2)),
            false
        ));
        uint256 startTime = ico.startTime();
        team.push(TeamsAllocation(
            12,
            3,
            uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x659b62c1543bf0b977317c3ad2328de4987b7000
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(7777777775).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x5101a786e77d612e1bf47359276e0a70ea801fb5
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(194444445).mul(uint(10) ** uint(DECIMALS - 3)),
            startTime,
            0x2c0f6226a2480e8c4ec4e0b5d44e8bdb8344f57e
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0xf8ce4ffe931ca4c87ea79d86b5d464e0083d5c34
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(22469135833333333333333),
            startTime,
            0x9d04221adf768d1023061b2357cc9cd037cbb760
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(26790123333333333333333),
            startTime,
            0x318f512c75a2dd023345969adb83925508f25243
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(4148148055555555555555),
            startTime,
            0x211bd01efd80d7986fb25156012ae7fe3a82fa6b
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(2666666675).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0xc3e6be81e11da0c144c0776e8d2a9f10952d8f2d
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(1555555554).mul(uint(10) ** uint(DECIMALS - 2)),
            startTime,
            0x19c57db52ffd39bdfa5203726f83f48f6c676f5a
        ));
    }

}