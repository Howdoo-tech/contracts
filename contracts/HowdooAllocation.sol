pragma solidity 0.4.18;

import "./Ownable.sol";
import "./Howdoo.sol";
import "./SafeMath.sol";
import "./ICO.sol";


contract HowdooAllocation is Ownable {

    using SafeMath for uint256;

    uint256 public constant DECIMALS = 18;

    uint256 public constant MONTH_SECONDS = 2629744;

    uint256 public remainingTokens;

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
        remainingTokens = uint256(888888888).mul(uint(10) ** uint(DECIMALS - 1));
        uint256 startTime = ico.startTime();

        allocations.push(Allocation(
            0x1d73e7becf5d615e2c0ad7de5feaab38389e4150,
            uint(10121066657).mul(uint(10) ** uint(DECIMALS - 2)),
            false
        ));

        team.push(TeamsAllocation(
            12,
            3,
            uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x1d73e7becf5d615e2c0ad7de5feaab38389e4151
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(7777777775).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x1d73e7becf5d615e2c0ad7de5feaab38389e4152
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(194444445).mul(uint(10) ** uint(DECIMALS - 3)),
            startTime,
            0x1d73e7becf5d615e2c0ad7de5feaab38389e4153
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x1d73e7becf5d615e2c0ad7de5feaab38389e4154
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(224691358333333333333).mul(uint(10) ** uint(DECIMALS - 16)),
            startTime,
            0x1d73e7becf5d615e2c0ad7de5feaab38389e4155
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(267901233333333333333).mul(uint(10) ** uint(DECIMALS - 16)),
            startTime,
            0x1d73e7becf5d615e2c0ad7de5feaab38389e4156
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(41481480555555555556).mul(uint(10) ** uint(DECIMALS - 16)),
            startTime,
            0x1d73e7becf5d615e2c0ad7de5feaab38389e4157
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(2666666675).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x1d73e7becf5d615e2c0ad7de5feaab38389e4158
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(1555555554).mul(uint(10) ** uint(DECIMALS - 2)),
            startTime,
            0x1d73e7becf5d615e2c0ad7de5feaab38389e4159
        ));
    }

    function setHowdoo(address _howdoo) public onlyOwner {
        require(_howdoo != address(0));
        howdoo = Howdoo(_howdoo);
    }

    function setAllocation(uint256 _amount, address[] _addresses) public onlyOwner returns (bool) {
        require(remainingTokens > 0);
        require(_amount > 0);
        require(_addresses.length >= 1);
        require(_amount.mul(uint256(_addresses.length)) <= remainingTokens);

        for (uint8 i = 0; i < _addresses.length; i++) {
            require(_addresses[i] != address(0));
            allocations.push(Allocation(_addresses[i], _amount, false));
            remainingTokens = remainingTokens.sub(_amount);
        }
        return true;
    }

    function claim() public {
        allocateInternal(msg.sender);
    }

    function allocate() public onlyOwner {
        allocateInternal(address(0));
    }

    function allocateInternal(address _holder) internal {
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

            uint256 periods = now.sub(member.allocationTime).div(member.cliff.mul(MONTH_SECONDS));
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