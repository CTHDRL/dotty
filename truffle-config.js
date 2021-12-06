const HDWalletProvider = require('@truffle/hdwallet-provider');
const dotenv = require('dotenv')

dotenv.config()

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    staging: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, `https://polygon-mumbai.infura.io/v3/${process.env.POLYGON_PROJECT_ID}`),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      chainId: 80001
    },
    production: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, `https://rpc-mainnet.matic.network`),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/abis/',
  migrations_directory: './src/migrations/',
  compilers: {
    solc: {
      version: '0.8.4',
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}
