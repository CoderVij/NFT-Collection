// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";


contract CryptoDevs is ERC721Enumerable, Ownable
{
    string _baseTokenURI;

    uint public _price = 0.01 ether;

    bool public _paused;
    uint256 public maxTokenIds = 20;

    uint256 public tokenIds;

    IWhitelist whitelist;

    bool public presaleStarted;
    uint256 public presaleEnded;

    modifier onlywhenNotPaused
    {
        require(!_paused, "Contract currently paused");
        _;
    }

    constructor(string memory baseURI, address whitelistContract) ERC721("Crypto Devs", "CD")
    {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }


    function startPresale() public onlyOwner
    {
        presaleStarted  =true;
        presaleEnded = block.timestamp + 5 minutes;
    }

    receive() external payable {}
    fallback() external payable {}
}