pragma solidity 0.4.19;


import "./SellableToken.sol";
import "./ICO.sol";


contract PrivateSale is SellableToken {

    ICO public ico;

    uint256 public minInvest;

    uint256 public price = 5000;

    mapping (address => bool) public whitelist;

    event WhitelistSet(address indexed contributorAddress, bool isWhitelisted);

    function PrivateSale(
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
        _etherPriceInUSD,
        _maxTokenSupply
    ) {
        require(_startTime > 0 && _endTime > _startTime);
        startTime = _startTime;
        endTime = _endTime;
        minInvest = _minInvest;
    }

    /* public methods */
    function() public payable {
        require(true == whitelist[msg.sender] && buy(msg.sender, msg.value) == true);
    }

    function setICO(address _ico) public onlyOwner {
        require(_ico != address(0));
        ico = ICO(_ico);
    }

    function isActive() public view returns (bool) {
        if (maxTokenSupply > uint256(0) && soldTokens == maxTokenSupply) {
            return false;
        }

        return withinPeriod();
    }

    function withinPeriod() public view returns (bool) {
        return block.timestamp >= startTime && block.timestamp <= endTime;
    }

    function changeMinInvest(uint256 _minInvest) public onlyOwner {
        minInvest = _minInvest;
    }

    function updateWhitelist(address _address, bool isWhitelisted) public onlyOwner {
        whitelist[_address] = isWhitelisted;
        WhitelistSet(_address, isWhitelisted);
    }

    function mint(address _address, uint256 _tokenAmount) public onlyOwner returns (uint256) {
        if (isActive()) {
            return mintInternal(_address, _tokenAmount);
        }

        return 0;
    }

    function moveUnsoldTokens() public onlyOwner {
        if (address(ico) != address(0) && now >= endTime && !isActive() && maxTokenSupply > soldTokens) {
            ico.updateStateWithPrivateSale(maxTokenSupply.sub(soldTokens), investors);
            maxTokenSupply = soldTokens;
        }
    }

    function calculateTokensAmount(uint256 _value) public view returns (uint256 amount) {
        if (_value == 0 || _value < (uint256(1 ether).mul(minInvest).div(etherPriceInUSD))) {
            return 0;
        }

        amount = _value.mul(etherPriceInUSD).div(price);
    }

    function calculateEthersAmount(uint256 _amount) public view returns (uint256 ethersAmount) {
        if (_amount == 0) {
            return 0;
        }

        ethersAmount = _amount.mul(price).div(etherPriceInUSD);

        if (ethersAmount < (uint256(1 ether).mul(minInvest).div(etherPriceInUSD))) {
            return 0;
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
        uint256 priceValue
    ) {
        start = startTime;
        end = endTime;
        sold = soldTokens;
        maxSupply = maxTokenSupply;
        tokensPerEth = calculateTokensAmount(1 ether);
        tokensPerBtc = calculateTokensAmount(_ethPerBtc);
        tokensPerLtc = calculateTokensAmount(_ethPerLtc);
        priceValue = price;
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
