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
            0x3d77a4922a60be503d5043b9ca74291329277d52,
            uint(10121066657).mul(uint(10) ** uint(DECIMALS - 2)),
            false
        ));
        uint256 startTime = ico.startTime();
        team.push(TeamsAllocation(
            12,
            3,
            uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x7ba56dc276903a26d46c2b666014c855a70718eb
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(7777777775).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x032d8c2173c2ee8ff0c19e01467299986bb61a06
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(194444445).mul(uint(10) ** uint(DECIMALS - 3)),
            startTime,
            0x8e87a885e1d9fd1d9c6ee31c5f14d7b50b508bc4
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x33dd6da34ecbe52675e33eacfa9b789648f39d2a
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(22469135833333333333333),
            startTime,
            0x0c515bb26e0fbdf562bf08f8dda99e6b4d54ffb9
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(26790123333333333333333),
            startTime,
            0x5744a734e9246dce2769c0e74bdf03e6de468a86
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(4148148055555555555555),
            startTime,
            0x1f369fd56608aedf68ccae833ee898dcd3c12080
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(2666666675).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0xacd340a0d3e03aada1b10e1782b59248d0ae4f15
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(1555555554).mul(uint(10) ** uint(DECIMALS - 2)),
            startTime,
            0xe1f76171386507b74270186e52e3c853c5536b44
        ));
    }

}