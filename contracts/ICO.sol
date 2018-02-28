pragma solidity 0.4.19;

import "./SellableToken.sol";


contract ICO is SellableToken {

    uint256 public minInvest;

    mapping (address => bool) public whitelist;

    event WhitelistSet(address indexed contributorAddress, bool isWhitelisted);

    function ICO(
        address _multivestAddress,
        address _howdoo,
        address _etherHolder,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _etherPriceInUSD, // if price 709.38000 the  value has to be 70938000
        uint256 _minInvest, //if price 250.28000 the  value has to be 25028000
        uint256 _maxTokenSupply
    ) public SellableToken(
        _multivestAddress,
        _howdoo,
        _etherHolder,
        _startTime,
        _endTime,
        _etherPriceInUSD,
        _maxTokenSupply
    ) {
        minInvest = _minInvest;

        tiers.push(Tier(uint256(444444444).mul(uint256(10) ** DECIMALS.sub(1)), uint256(5000)));//@ 0,05 USD
        tiers.push(Tier(uint256(1777777776).mul(uint256(10) ** DECIMALS.sub(1)), uint256(8000)));//@ 0,08 USD
        tiers.push(Tier(uint256(2666666664).mul(uint256(10) ** DECIMALS.sub(1)), uint256(9000)));//@ 0,09 USD
        tiers.push(Tier(uint256(3111111108).mul(uint256(10) ** DECIMALS.sub(1)), uint256(1000)));//@ 0,10 USD
    }

    /* public methods */
    function() public payable {
        require(true == whitelist[msg.sender] && buy(msg.sender, msg.value) == true);
    }

    function changeMinInvest(uint256 _minInvest) public onlyOwner {
        minInvest = _minInvest;
    }

    function updateWhitelist(address _address, bool isWhitelisted) public onlyOwner {
        whitelist[_address] = isWhitelisted;
        WhitelistSet(_address, isWhitelisted);
    }

    function airdrop(uint256 _toInvestorsAmount) public onlyOwner {
        if (!isActive() && now >= startTime && _toInvestorsAmount > 0) {
            if (maxTokenSupply > soldTokens) {
                airdropAmount = maxTokenSupply.sub(soldTokens).div(2);
                maxTokenSupply = soldTokens;
                require(airdropAmount == howdoo.mint(howdoo.hisAddress(), airdropAmount));
            }

            if (investors.length > airdropPointer) {
                _toInvestorsAmount = airdropPointer.add(_toInvestorsAmount);
                if (_toInvestorsAmount > investors.length) {
                    _toInvestorsAmount = investors.length;
                }
                uint256 investorTokens = airdropAmount.div(investors.length);
                for (uint256 i = airdropPointer; i < _toInvestorsAmount; i++) {
                    require(investorTokens == howdoo.mint(investors[i], investorTokens));
                }
                airdropPointer = i;
            }
        }
    }

    function calculateTokensAmount(uint256 _value) public view returns (uint256) {
        if (_value == 0 || _value < ((uint256(10) ** DECIMALS).mul(minInvest).div(etherPriceInUSD))) {
            return 0;
        }

        uint256 newSoldTokens = soldTokens;
        uint256 remainingValue = _value;

        for (uint i = 0; i < tiers.length; i++) {
            if (tiers[i].maxAmount > soldTokens) {
                uint256 amount = remainingValue.mul(etherPriceInUSD).div(tiers[i].price);

                if (newSoldTokens.add(amount) > tiers[i].maxAmount) {
                    uint256 diff = tiers[i].maxAmount.sub(newSoldTokens);
                    remainingValue = remainingValue.sub(diff.mul(tiers[i].price).div(etherPriceInUSD));
                    newSoldTokens = newSoldTokens.add(diff);
                } else {
                    remainingValue = 0;
                    newSoldTokens = newSoldTokens.add(amount);
                }

                if (remainingValue == 0) {
                    break;
                }
            }
        }

        if (remainingValue > 0) {
            return 0;
        }

        return newSoldTokens.sub(soldTokens);
    }

    function calculateEthersAmount(uint256 _amount) public view returns (uint256) {
        if (_amount == 0) {
            return 0;
        }

        uint256 ethersAmount;
        uint256 remainingValue = _amount;

        for (uint i = 0; i < tiers.length; i++) {
            if (tiers[i].maxAmount > soldTokens) {
                if (soldTokens.add(_amount) > tiers[i].maxAmount) {
                    uint256 diff = tiers[i].maxAmount.sub(soldTokens);
                    remainingValue = remainingValue.sub(diff);
                    ethersAmount = ethersAmount.add(diff.mul(tiers[i].price).div(etherPriceInUSD));
                } else {
                    ethersAmount = ethersAmount.add(remainingValue.mul(tiers[i].price).div(etherPriceInUSD));
                    remainingValue = 0;
                }

                if (remainingValue == 0) {
                    break;
                }
            }
        }

        if (remainingValue > 0 || ethersAmount < ((uint256(10) ** DECIMALS).mul(minInvest).div(etherPriceInUSD))) {
            return 0;
        }

        return ethersAmount;
    }

    function getStats() public view returns (
        uint256 start,
        uint256 end,
        uint256 sold,
        uint256 maxSupply,
        uint256 tokensPerEth,
        uint256 tierPrice,
        uint256 tierMaxAmount
    ) {
        start = startTime;
        end = endTime;
        sold = soldTokens;
        maxSupply = maxTokenSupply;
        tokensPerEth = calculateTokensAmount(1 ether);
        (tierPrice, tierMaxAmount) = getCurrentTier();
    }

    function getCurrentTier() public view returns (uint256 tierPrice, uint256 tierMaxAmount){
        for (uint i = 0; i < tiers.length; i++) {
            if (tiers[i].maxAmount > soldTokens) {
                tierPrice = tiers[i].price;
                tierMaxAmount = tiers[i].maxAmount;
                break;
            }
        }
    }

    function buy(address _address, uint256 _value) internal returns (bool) {
        if (_value == 0) {
            return false;
        }
        require(_address != address(0) && withinPeriod());

        if (priceUpdateAt.add(1 hours) < block.timestamp) {
            update();
            priceUpdateAt = block.timestamp;
        }

        uint256 amount = calculateTokensAmount(_value);

        require(amount > 0 && amount == mintInternal(_address, amount));

        collectedEthers = collectedEthers.add(_value);
        Contribution(_address, _value, amount);

        transferEthers();
        return true;
    }

}
