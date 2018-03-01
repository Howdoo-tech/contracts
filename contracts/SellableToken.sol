pragma solidity 0.4.19;


import "./Howdoo.sol";
import "./Multivest.sol";
import "./OraclizeAPI.sol";


contract SellableToken is Multivest, usingOraclize {

    uint256 public constant DECIMALS = 18;

    Howdoo public howdoo;

    uint256 public startTime;

    uint256 public endTime;

    uint256 public maxTokenSupply;

    uint256 public soldTokens;

    address[] public investors;

    uint256 public airdropAmount;

    uint256 public airdropPointer;

    uint256 public collectedEthers;

    uint256 public priceUpdateAt = block.timestamp;

    address public etherHolder;

    Tier[] public tiers;

    struct Tier {
        uint256 maxAmount;
        uint256 price;
    }

    event NewOraclizeQuery(string _description);
    event NewHowdooPriceTicker(string _price);

    function SellableToken(
        address _multivestAddress,
        address _howdoo,
        address _etherHolder,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _etherPriceInUSD,
        uint256 _maxTokenSupply
    ) public Multivest(_multivestAddress)
    {
        require(_howdoo != address(0));
        howdoo = Howdoo(_howdoo);

        require(_startTime < _endTime);
        etherHolder = _etherHolder;
        require((_maxTokenSupply == uint256(0)) || (_maxTokenSupply <= howdoo.maxSupply()));

        startTime = _startTime;
        endTime = _endTime;
        etherPriceInUSD = _etherPriceInUSD;
        maxTokenSupply = _maxTokenSupply;

//        oraclize_setNetwork(networkID_auto);
//        oraclize = OraclizeI(OAR.getAddress());
    }

    function setHowdoo(address _howdoo) public onlyOwner {
        require(_howdoo != address(0));
        howdoo = Howdoo(_howdoo);
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

    // set ether price in USD with 5 digits after the decimal point
    //ex. 308.75000
    //for updating the price through  multivest
    function setEtherInUSD(string _price) public onlyAllowedMultivests(msg.sender) {
        bytes memory bytePrice = bytes(_price);
        uint256 dot = bytePrice.length.sub(uint256(6));

        // check if dot is in 6 position  from  the last
        require(0x2e == uint(bytePrice[dot]));

        uint256 newPrice = uint256(10 ** 23).div(parseInt(_price, 5));

        require(newPrice > 0);

        etherPriceInUSD = parseInt(_price, 5);

        priceUpdateAt = block.timestamp;

        NewHowdooPriceTicker(_price);
    }

    function setEtherHolder(address _etherHolder) public onlyOwner {
        require(_etherHolder != address(0));
        etherHolder = _etherHolder;
    }

    function mint(address _address, uint256 _tokenAmount) public onlyOwner returns (uint256) {
        if (isActive() && now > startTime) {
            return mintInternal(_address, _tokenAmount);
        }

        return 0;
    }

    function __callback(bytes32, string _result, bytes) public {
        require(msg.sender == oraclize_cbAddress());
        uint256 result = parseInt(_result, 5);
        uint256 newPrice = uint256(10 ** 23).div(result);
        require(newPrice > 0);
        //not update when increasing/decreasing in 3 times
        if (result.div(3) < etherPriceInUSD || result.mul(3) > etherPriceInUSD) {
            etherPriceInUSD = result;

            NewHowdooPriceTicker(_result);
        }
    }

    function transferEthers() internal {
        etherHolder.transfer(this.balance);
    }

    function update() internal {
        if (oraclize_getPrice("URL") > this.balance) {
            NewOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
        } else {
            NewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclize_query("URL", "json(https://api.kraken.com/0/public/Ticker?pair=ETHUSD).result.XETHZUSD.c.0");
        }
    }

    function mintInternal(address _address, uint256 _tokenAmount) internal returns (uint256) {
        if (howdoo.balanceOf(_address) == 0) {
            investors.push(_address);
        }
        uint256 mintedAmount = howdoo.mint(_address, _tokenAmount);

        require(mintedAmount == _tokenAmount);

        soldTokens = soldTokens.add(_tokenAmount);
        if (maxTokenSupply > 0) {
            require(maxTokenSupply >= soldTokens);
        }

        return _tokenAmount;
    }

}