// contracts/Dotty.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Dotties is ERC1155, Ownable {

    constructor() public ERC1155("https://ipfs.infura.io/ipfs/Qmc4Ue8EQwcioWRNDdmzovwPvLuqhwgWxxBinemBroCjEg/metadata/{1}.json") {}

    function myMintFunc(uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyOwner {
      _mintBatch(msg.sender, ids, amounts, data);
    }

}
