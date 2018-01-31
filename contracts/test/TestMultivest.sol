pragma solidity ^0.4.13;

import '../Multivest.sol';
import '../HowdooERC20.sol';

contract TestMultivest is Multivest, HowdooERC20 {
    function TestMultivest(address allowedMultivest)
    HowdooERC20(
        1000000,
        "TEST",
        18,
        "TST",
        false,
        false
    )
    Multivest(allowedMultivest)
    {
    }

    function buy(address _address, uint256 value) internal returns (bool) {
        return transfer(_address, value);
    }
    function updatePrice() internal {
        3+6;
    }
}