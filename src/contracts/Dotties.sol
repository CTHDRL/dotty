// contracts/Dotty.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Dotties is ERC1155, Ownable {

    constructor() ERC1155("https://ipfs.infura.io/ipfs/Qmc4Ue8EQwcioWRNDdmzovwPvLuqhwgWxxBinemBroCjEg/metadata/{1}.json") {
      uint[] memory ids = new uint[](125);
      uint[] memory amounts = new uint[](125);
      for(uint i = 0; i < 125; i++) {
        ids[i] = i;
        amounts[i] = 1;
      }
      _mintBatch(msg.sender, ids, amounts, '0x00');
    }

}
