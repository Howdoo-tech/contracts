pragma solidity 0.4.19;


import "../PrivateSale.sol";


contract TestPrivateSale is PrivateSale {
    function TestPrivateSale(
        address _multivestAddress,
        address _howdoo,
        address _etherHolder,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _etherPriceInUSD, // if price 709.38000 the  value has to be 70938000
        uint256 _minInvest, //if price 250.28000 the  value has to be 25028000
        uint256 _maxTokenSupply
    ) public PrivateSale(
        _multivestAddress,
        _howdoo,
        _etherHolder,
        _startTime,
        _endTime,
        _etherPriceInUSD, // if price 709.38000 the  value has to be 70938000
        _minInvest, //if price 250.28000 the  value has to be 25028000
        _maxTokenSupply
    ) {

    }

    function testChangeICOPeriod(uint256 _start, uint256 _end) public {
        startTime = _start;
        endTime = _end;
    }

    function testChangeSoldTokens(uint256 _sold) public {
        soldTokens = _sold;
    }

    function testCalculateTokensAmount(uint256 _value, uint256 _soldTokens) public returns (uint256) {
        soldTokens = _soldTokens;

        return calculateTokensAmount(_value);
    }

    function testCalculateEthersAmount(uint256 _value, uint256 _soldTokens) public returns (uint256) {
        soldTokens = _soldTokens;

        return calculateEthersAmount(_value);
    }
}
