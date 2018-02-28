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
            0x1915509358124bf16675c62e975c7599ffef8e4f,
            uint(10121066657).mul(uint(10) ** uint(DECIMALS - 2)),
            false
        ));
        uint256 startTime = ico.startTime();
        team.push(TeamsAllocation(
            12,
            3,
            uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0xa1c0fb89600984eef1a62b36f9d131c033ea6a09
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(7777777775).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0xb98ad5e27132d24940ec76c2e7627abfe36621ae
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(194444445).mul(uint(10) ** uint(DECIMALS - 3)),
            startTime,
            0xcb598ebd45c02d989dac06f9065ed15a0f942f1f
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x104739de9ffe59a12a8c129639b7f1ce22271937
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(22469135833333333333333),
            startTime,
            0xa334ca0fce93f0690d35549ef779663b78fd96b0
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(26790123333333333333333),
            startTime,
            0xa7b21a0f3c9a84c32bf2f3d272935ec8e3273ea6
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(4148148055555555555555),
            startTime,
            0x12aae8746a49c0ee8e2850d612099f7e9f0c124a
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(2666666675).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x0255ef735d35339688d02ac1e5e4638b015e7c09
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(1555555554).mul(uint(10) ** uint(DECIMALS - 2)),
            startTime,
            0x0d86439021cae90e94aedcaccefbe2700455b244
        ));
    }

}