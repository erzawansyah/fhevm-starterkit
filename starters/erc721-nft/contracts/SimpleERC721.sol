// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title SimpleERC721
/// @notice Minimal ERC-721-like NFT contract for starters
contract SimpleERC721 {
    string public name = "SimpleNFT";
    string public symbol = "SNFT";

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    function _mint(address to, uint256 tokenId) internal {
        require(ownerOf[tokenId] == address(0), "exists");
        ownerOf[tokenId] = to;
        balanceOf[to] += 1;
        emit Transfer(address(0), to, tokenId);
    }

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }

    function transfer(address to, uint256 tokenId) external {
        address owner = ownerOf[tokenId];
        require(owner == msg.sender, "not owner");
        ownerOf[tokenId] = to;
        balanceOf[msg.sender] -= 1;
        balanceOf[to] += 1;
        emit Transfer(msg.sender, to, tokenId);
    }
}
