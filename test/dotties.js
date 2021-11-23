const { expect } = require("chai");
const { ethers } = require("hardhat");
const _ = require('lodash')

describe("Dotties", function () {
  it("Mint the tokens", async function () {
    const Dotties = await ethers.getContractFactory("Dotties")
    const dotties = await Dotties.deploy()
    await dotties.deployed()
    const steps = Math.floor(255 / 50)
    const ids = Array(steps).fill(0).reduce((ids, i, b) => [
      ...ids,
      ...Array(steps).fill(0).reduce((ids2, j, g) => [
        ...ids2,
        ...Array(steps).fill(0).reduce((ids3, k, r) => [
          ...ids3,
          (256 * 256 * 50 * b) + (256 * 50 * g) + r * 50
        ], [])
      ], [])
    ], [])
    await dotties.myMintFunc(ids, ids.map(i => 1), '0x00')
    const [owner] = await ethers.getSigners()
    console.log(await dotties.balanceOf(owner.address,100))
  })
})
