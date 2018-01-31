pragma solidity 0.4.18;


import "../Howdoo.sol";


contract TestHowdoo is Howdoo {

    function TestHowdoo(
        address _treasuryAddress,
        address _hisAddress,
        address _bountyAddress,
        address _allowedAddress,
        bool _locked
    )
    public Howdoo(
         _treasuryAddress,
         _hisAddress,
         _bountyAddress,
         _allowedAddress,
         _locked
        )
    {

    }

    function testSetFreezing(bool _isFrozen) public {
        transferFrozen = _isFrozen;
    }
}
