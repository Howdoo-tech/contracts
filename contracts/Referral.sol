pragma solidity 0.4.19;


import "./Multivest.sol";
import "./Howdoo.sol";


contract Referral is Multivest {

    Howdoo public howdoo;

    uint256 public constant DECIMALS = 18;

    uint256 public totalSupply = 2111111108 * 10 ** DECIMALS.sub(2);

    /* constructor */
    function Referral(
        address _howdoo,
        address _multivest
    ) public Multivest(_multivest) {
        require(_howdoo != address(0));
        howdoo = Howdoo(_howdoo);
    }

    function setHowdoo(address _howdoo) public onlyOwner {
        require(_howdoo != address(0));
        howdoo = Howdoo(_howdoo);
    }

    function multivestMint(
        address _address,
        uint256 _amount,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public onlyAllowedMultivests(verify(keccak256(msg.sender, _amount), _v, _r, _s)) {
        _amount = _amount.mul(10 ** DECIMALS);
        require(
            _address == msg.sender &&
            _amount > 0 &&
            _amount <= totalSupply &&
            _amount == howdoo.mint(_address, _amount)
        );

        totalSupply = totalSupply.sub(_amount);
    }

    function buy(address _address, uint256 value) internal returns (bool) {
        _address = _address;
        value = value;
        return true;
    }
}
