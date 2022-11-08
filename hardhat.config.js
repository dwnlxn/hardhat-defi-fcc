require("dotenv").config()

require("@nomiclabs/hardhat-etherscan")
require("@nomiclabs/hardhat-waffle")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || ""
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || ""

module.exports = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      { version: "0.8.7" },
      { version: "0.4.19" },
      { version: "0.6.12" },
      { version: "0.6.6" },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: MAINNET_RPC_URL,
      },
    },
    goerli: {
      chainId: 5,
      url: GOERLI_RPC_URL,
      accounts:
        process.env.GOERLI_PRIVATE_KEY !== undefined
          ? [process.env.GOERLI_PRIVATE_KEY]
          : [],
      blockConfirmations: 2,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: 0,
  },
}
