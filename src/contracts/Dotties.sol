// contracts/Dotty.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract Dotties is ERC1155 {

    string public name = 'Dotties';

    constructor() ERC1155("https://ipfs.infura.io/ipfs/Qmb4Hc6VDzM5GmR72yy96ij4wKH8CH23dSPx93iGWkWa1Y/{id}.json") {
      uint[] memory ids = new uint[](125);
      uint[] memory amounts = new uint[](125);
      for(uint i = 0; i < 125; i++) {
        ids[i] = i;
        amounts[i] = 1;
      }
      _mintBatch(msg.sender, ids, amounts, '0x00');
    }

}
