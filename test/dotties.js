const chaiAsPromised = require('chai-as-promised')
const Dotties = artifacts.require('./Dotties.sol')
const Promise = require('bluebird')
const chai = require('chai')

chai.use(chaiAsPromised).should()

contract('Dotties', (accounts) => {

  const adminAccount = accounts[0]
  const user1Account = accounts[1]
  const user2Account = accounts[2]
  const user3Account = accounts[3]
  const user4Account = accounts[4]

  beforeEach(async() => {
    dotties = await Dotties.deployed()
  })

  it("should mint all NFTs", async function () {
    console.log(await dotties.uri(0))
    const ids = Array(125).fill(0).map((i, j) => j)
    await Promise.mapSeries(ids, async (id) => {
      const adminBalance = await dotties.balanceOf(adminAccount, id)
      assert.equal(adminBalance.toNumber(), 1, `it allocates dotty ${id}`)
    })
  })

  it("should allow buying of NFTs", async function () {
    await dotties.safeTransferFrom(adminAccount, user1Account, 0, 1, "0x0")
    const adminBalance = await dotties.balanceOf(adminAccount, 0)
    assert.equal(adminBalance.toNumber(), 0, `it removes the nft to the admins account`)
    const user1Balance = await dotties.balanceOf(user1Account, 0)
    assert.equal(user1Balance.toNumber(), 1, `it adds the nft to the users account`)
  })


})
