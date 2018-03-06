pragma solidity 0.4.19;

import "./SellableToken.sol";
import "./PrivateSale.sol";


contract ICO is SellableToken {

    PrivateSale public privateSale;

    uint256 public minInvest;

    function ICO(
        address _multivestAddress,
        address _howdoo,
        address _etherHolder,
        uint256 _etherPriceInUSD, // if price 709.38000 the  value has to be 70938000
        uint256 _minInvest, //if price 250.28000 the  value has to be 25028000
        uint256 _maxTokenSupply
    ) public SellableToken(
        _multivestAddress,
        _howdoo,
        _etherHolder,
        _etherPriceInUSD,
        _maxTokenSupply
    ) {
        minInvest = _minInvest;

        tiers.push(
            Tier(
                uint256(1333333332).mul(uint256(10) ** DECIMALS.sub(1)),
                uint256(8000),
                1522238340,
                1524052740
            )
        );//@ 0,08 USD
        tiers.push(
            Tier(
                uint256(222222222).mul(uint256(10) ** DECIMALS),
                uint256(9000),
                1524916740,
                0
            )
        );//@ 0,09 USD
        tiers.push(
            Tier(
                uint256(2666666664).mul(uint256(10) ** DECIMALS.sub(1)),
                uint256(10000),
                0,
                1527335940
            )
        );//@ 0,10 USD

        startTime = 1522238340;
        endTime = 1527335940;
    }

    /* public methods */
    function setPrivateSale(address _privateSale) public onlyOwner {
        if (_privateSale != address(0)) {
            privateSale = PrivateSale(_privateSale);
        }
    }

    function changeMinInvest(uint256 _minInvest) public onlyOwner {
        minInvest = _minInvest;
    }

    function changePreICODates(uint256 _start, uint256 _end) public onlyOwner {
        if (_start != 0 && _start < _end) {
            Tier storage preICOTier = tiers[PRE_ICO_ID];
            preICOTier.startTime = _start;
            preICOTier.endTime = _end;
            startTime = _start;
        }
    }

    function changeICODates(uint256 _start, uint256 _end) public onlyOwner {
        if (_start != 0 && _start < _end) {
            Tier storage icoFirsTier = tiers[PRE_ICO_ID.add(1)];
            icoFirsTier.startTime = _start;
            Tier storage icoLastTier = tiers[tiers.length.sub(1)];
            icoLastTier.endTime = _end;
            endTime = _end;
        }
    }

    function airdrop(uint256 _toInvestorsAmount) public onlyOwner {
        if (tiers[tiers.length.sub(1)].endTime <= now) {
            airdropInternal(_toInvestorsAmount);
        }
    }

    function calculateTokensAmount(uint256 _value) public returns (uint256) {
        if (_value == 0 || _value < (uint256(1 ether).mul(minInvest).div(etherPriceInUSD))) {
            return 0;
        }

        uint256 amount;
        if (isPreICOActive()) {
            amount = _value.mul(etherPriceInUSD).div(tiers[i].price);
            return soldTokens.add(amount) <= tiers[PRE_ICO_ID].maxAmount ? amount : 0;
        }

        if (tiers[PRE_ICO_ID.add(1)].startTime > now || isICOFinished()) {
            return 0;
        }
        uint256 newSoldTokens = soldTokens;
        uint256 remainingValue = _value;

        for (uint i = PRE_ICO_ID.add(1); i < tiers.length; i++) {
            amount = remainingValue.mul(etherPriceInUSD).div(tiers[i].price);

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

        if (remainingValue > 0) {
            return 0;
        }

        return newSoldTokens.sub(soldTokens);
    }

    function calculateEthersAmount(uint256 _amount) public constant returns (uint256) {
        if (_amount == 0) {
            return 0;
        }
        uint256 ethersAmount;
        if (isPreICOActive()) {
            ethersAmount = _amount.mul(tiers[i].price).div(etherPriceInUSD);
            if (
                ethersAmount < (uint256(1 ether).mul(minInvest).div(etherPriceInUSD)) ||
                soldTokens.add(_amount) >= tiers[PRE_ICO_ID].maxAmount
            ) {
                return 0;
            }
            return ethersAmount;
        }

        if (tiers[PRE_ICO_ID.add(1)].startTime > now || isICOFinished()) {
            return 0;
        }
        uint256 remainingValue = _amount;

        for (uint i = PRE_ICO_ID.add(1); i < tiers.length; i++) {

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

        if (remainingValue > 0 || ethersAmount < (uint256(1 ether).mul(minInvest).div(etherPriceInUSD))) {
            return 0;
        }

        return ethersAmount;
    }

    function updateStateWithPrivateSale(uint256 _amount, address[] _investors) public {
        if (_amount > 0 && msg.sender == address(privateSale)) {
            Tier storage preICOTier = tiers[PRE_ICO_ID];
            preICOTier.maxAmount = preICOTier.maxAmount.add(_amount);
            maxTokenSupply = maxTokenSupply.add(_amount);

            if (_investors.length > 0) {
                for (uint256 i = 0; i < _investors.length; i++) {
                    investors.push(_investors[i]);
                }
            }
        }
    }

    function getMinEthersInvestment() public view returns (uint256) {
        return uint256(1 ether).mul(minInvest).div(etherPriceInUSD);
    }

    function getStats(uint256 _ethPerBtc, uint256 _ethPerLtc) public view returns (
        uint256 start,
        uint256 end,
        uint256 sold,
        uint256 maxSupply,
        uint256 tokensPerEth,
        uint256 tokensPerBtc,
        uint256 tokensPerLtc,
        uint256[12] tiersData
    ) {
        start = tiers[PRE_ICO_ID].startTime;
        end = tiers[tiers.length.sub(1)].endTime;
        sold = soldTokens;
        maxSupply = maxTokenSupply;
        tokensPerEth = calculateTokensAmount(1 ether);
        tokensPerBtc = calculateTokensAmount(_ethPerBtc);
        tokensPerLtc = calculateTokensAmount(_ethPerLtc);
        uint256 j = 0;
        for (uint256 i = 0; i < tiers.length; i++) {
            tiersData[j++] = uint256(tiers[i].maxAmount);
            tiersData[j++] = uint256(tiers[i].price);
            tiersData[j++] = uint256(tiers[i].startTime);
            tiersData[j++] = uint256(tiers[i].endTime);
        }
    }

    function buy(address _address, uint256 _value) internal returns (bool) {
        if (_value == 0) {
            return false;
        }
        require(_address != address(0) && (isPreICOActive() || !isICOFinished()));

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
