/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers"); //if you not require it get below error
//ethers.getContract is not a function

const COIN_MARKET_CAP_API = process.env.COIN_MARKET_CAP_API || "";
const SEPOLIA_RPC_URL_BY_INFURA = process.env.SEPOLIA_RPC_URL_BY_INFURA || "";
const METAMASK_PRIVATE_KEY_1 = process.env.METAMASK_PRIVATE_KEY_1 || "";
const METAMASK_PRIVATE_KEY_2 = process.env.METAMASK_PRIVATE_KEY_2 || "";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const GANACHE_RPC_URL = process.env.GANACHE_RPC_URL;
const GANACHE_MNEMONIC = process.env.GANACHE_MNEMONIC;

module.exports = {
     defaultNetwork: "hardhat",
     networks: {
          hardhat: {
               chainId: 31337,
               // gasPrice: 130000000000,
          },
          localhost: {
               // for this yarn hardhat node must be running otherwise throw error
               chainId: 31337,
               blockConfirmations: 1,
               // gasPrice: 130000000000,
          },
          sepolia: {
               url: SEPOLIA_RPC_URL_BY_INFURA,
               accounts: [METAMASK_PRIVATE_KEY_1, METAMASK_PRIVATE_KEY_2],
               chainId: 11155111,
               blockConfirmations: 6,
               saveDeployments: true,
          },
          ganache: {
               url: GANACHE_RPC_URL,
               mnemonic: GANACHE_MNEMONIC,
               chainId: 1337,
          },
     },
     solidity: {
          version: "0.8.20",
          version: "0.8.22",
          settings: {
               optimizer: {
                    enabled: true,
                    runs: 200,
               },
               // outputSelection: {
               //      "*": {
               //           "*": ["evm.bytecode"],
               //      },
               // },
               // viaIR: true,
          },
     },
     etherscan: {
          apiKey: ETHERSCAN_API_KEY,
          // customChains: [], // uncomment this line if you are getting a TypeError: customChains is not iterable
     },
     gasReporter: {
          enabled: false,
          currency: "PKR",
          excludeContracts: ["test/Token1.sol", "test/Token2.sol"],
          // outputFile: "gas-report.txt",
          noColors: true,
          coinmarketcap: COIN_MARKET_CAP_API,
     },
     namedAccounts: {
          deployer: {
               default: 0, // here this will by default take the first account as deployer
               11155111: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
          },
     },
     mocha: {
          timeout: 50000000,
     },
};
