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

    function setAllocation(uint256 _amount, address[] _addresses) public onlyOwner returns (bool) {
        require(remainingTokens > 0 && _amount > 0 && _addresses.length >= 1);
        require(_amount.mul(uint256(_addresses.length)) <= remainingTokens);

        for (uint8 i = 0; i < _addresses.length; i++) {
            require(_addresses[i] != address(0));
            allocations.push(Allocation(_addresses[i], _amount, false));
            remainingTokens = remainingTokens.sub(_amount);
        }
        return true;
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
            0xb14b776d4be750f9ed9ce629a9b23073a02ed278,
            uint(10121066657).mul(uint(10) ** uint(DECIMALS - 2)),
            false
        ));
        uint256 startTime = ico.startTime();
        team.push(TeamsAllocation(
            12,
            3,
            uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x0f58bcf3e42b27bc038898bf818579a6733eac6f
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(7777777775).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x00903baedb3ee3a2e744f652da33d644806ea186
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(194444445).mul(uint(10) ** uint(DECIMALS - 3)),
            startTime,
            0x8b466aefa665698715d8d33f09ab3574301d0992
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(9333333325).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x06373b7437a82f2b0609b6a78a245f42ec3f275c
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(22469135833333333333333),
            startTime,
            0x489b7b391dfb1afc1d004ee892c5b817ac49a5ee
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(26790123333333333333333),
            startTime,
            0xa9a2841b7cad2afe3975fc38ddbce501ce577891
        ));
        team.push(TeamsAllocation(
            36,
            1,
            uint(4148148055555555555555),
            startTime,
            0x9063ed54cda0c621cef4afb1eb782b7c2f887954
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(2666666675).mul(uint(10) ** uint(DECIMALS - 4)),
            startTime,
            0x682ef8a3f6ee7d2d34388beefbe4af020efa37ea
        ));
        team.push(TeamsAllocation(
            12,
            3,
            uint(1555555554).mul(uint(10) ** uint(DECIMALS - 2)),
            startTime,
            0xf056b46fdab3d2a061fd57ea6dad4fb5aec8a5db
        ));
    }

}