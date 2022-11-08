const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { getWeth, AMOUNT } = require("../scripts/getWeth")
const { networkConfig } = require("../helper-hardhat-config")

async function main() {
  await getWeth()
  const { deployer } = await getNamedAccounts()
  const lendingPool = await getLendingPool(deployer)
  console.log(`LendingPool address ${lendingPool.address}`)

  // deposit WETH; specify amt, approve and deposit
  const wethTokenAddress = networkConfig[network.config.chainId].wethToken
  await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
  console.log("Depositing...")
  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
  console.log("Deposited!")

  // borrow DAI
  // check what's available
  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
    lendingPool,
    deployer
  )
  const daiPrice = await getDaiPrice()
  const amountDaiToBorrow =
    availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
  console.log(`You can borrow ${amountDaiToBorrow} DAI`)
  const amountDaiToBorrowWei = await ethers.utils.parseEther(
    amountDaiToBorrow.toString()
  )
  console.log(`You can borrow ${amountDaiToBorrowWei.toString()} DAI in Wei`)
  // get the DAI
  const daiTokenAddress = networkConfig[network.config.chainId].daiToken
  await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer)
  await getBorrowUserData(lendingPool, deployer)

  // repay
  await repay(amountDaiToBorrowWei, daiTokenAddress, lendingPool, deployer)
  await getBorrowUserData(lendingPool, deployer)
}

// ********************************************   UTIL FUNCTIONS
async function getLendingPool(account) {
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    networkConfig[network.config.chainId].lendingPoolAddressesProvider,
    account
  )
  const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress,
    account
  )
  return lendingPool
}

async function getBorrowUserData(lendingPool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account)
  console.log(`You have ${totalCollateralETH} worth of ETH deposited.`)
  console.log(`You have ${totalDebtETH} worth of ETH borrowed.`)
  console.log(`You can borrow ${availableBorrowsETH} worth of ETH.`)
  return { availableBorrowsETH, totalDebtETH }
}

async function approveErc20(
  erc20Address,
  spenderAddress,
  amountToSpend,
  account
) {
  const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account)
  const txResponse = await erc20Token.approve(spenderAddress, amountToSpend)
  await txResponse.wait(1)
  console.log("Approved")
}

async function getDaiPrice() {
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    networkConfig[network.config.chainId].daiEthPriceFeed
  )
  const price = (await daiEthPriceFeed.latestRoundData())[1]
  console.log(`The DAI/ETH price is ${price.toString()}`)
  return price
}

async function borrowDai(
  daiAddress,
  lendingPool,
  amountDaiToBorrowWei,
  account
) {
  const borrowTx = await lendingPool.borrow(
    daiAddress,
    amountDaiToBorrowWei,
    1,
    0,
    account
  )
  borrowTx.wait(1)
  console.log("You've borrowed!")
}

async function repay(amount, daiAddress, lendingPool, account) {
  await approveErc20(daiAddress, lendingPool.address, amount, account)
  const repayTx = await lendingPool.repay(daiAddress, amount, 1, account)
  repayTx.wait(1)
  console.log("You've repaid!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
