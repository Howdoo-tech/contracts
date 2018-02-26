pragma solidity 0.4.19;


import "./Ownable.sol";
import "./SafeMath.sol";
import "./OraclizeAPI.sol";


contract Multivest is Ownable, usingOraclize {

    using SafeMath for uint256;

    uint256 public etherPriceInUSD; //$753.25  75325000
    /* public variables */
    mapping (address => bool) public allowedMultivests;

    /* events */
    event MultivestSet(address multivest);

    event MultivestUnset(address multivest);

    event Contribution(address holder, uint256 value, uint256 tokens);

    modifier onlyAllowedMultivests() {
        require(true == allowedMultivests[msg.sender]);
        _;
    }

    /* constructor */
    function Multivest(address _multivest) public {
        allowedMultivests[_multivest] = true;
    }

    function setAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = true;
        MultivestSet(_address);
    }

    function unsetAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = false;
        MultivestUnset(_address);
    }

    function multivestBuy(address _address, uint256 _value) public onlyAllowedMultivests {
        bool status = buy(_address, _value);
        require(status == true);
    }

    function buy(address _address, uint256 value) internal returns (bool);

}
