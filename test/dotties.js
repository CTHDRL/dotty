const { expect } = require("chai");
const { ethers } = require("hardhat");
const _ = require('lodash')

describe("Dotties", function () {
  it("Mint the tokens", async function () {
    const Dotties = await ethers.getContractFactory("Dotties")
    const dotties = await Dotties.deploy()
    await dotties.deployed()
    const steps = Math.floor(255 / 50)
    const ids = Array(steps).fill(0).reduce((ids, i, r) => [
      ...ids,
      ...Array(steps).fill(0).reduce((ids2, j, g) => [
        ...ids2,
        ...Array(steps).fill(0).reduce((ids3, k, b) => [
          ...ids3,
          (256 * 256 * 50 * r) + (256 * 50 * g) + (50 * b)
        ], [])
      ], [])
    ], [])
    await dotties.myMintFunc(ids, ids.map(i => 1), '0x00')
    const [owner] = await ethers.getSigners()
    console.log(await dotties.balanceOf(owner.address,100))
  })
})
