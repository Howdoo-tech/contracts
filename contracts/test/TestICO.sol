pragma solidity 0.4.19;

import "../ICO.sol";


contract TestICO is ICO {
    function TestICO(
        address _multivestAddress,
        address _howdoo,
        address _etherHolder,
        uint256 _etherPriceInUSD,
        uint256 _minInvest,
        uint256 _maxTokenSupply //uint256(150000000).mul(10 ** 18)
) public ICO(
        _multivestAddress,
        _howdoo,
        _etherHolder,
        _etherPriceInUSD,
        _minInvest,
        _maxTokenSupply
    ) {

    }

    function() public payable {
        require(buy(msg.sender, msg.value) == true);
    }

//    function testChangeICOPeriod(uint256 _start, uint256 _end) public {
//        startTime = _start;
//        endTime = _end;
//    }

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
