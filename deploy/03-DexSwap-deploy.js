const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config.js");
require("dotenv").config();
const { verify } = require("../utils/verify-contract-task.js");

module.exports = async ({ getNamedAccounts, deployments }) => {
     const { deploy, log } = deployments;
     const { deployer } = await getNamedAccounts();
     const Token1 = await deployments.get("Token1");
     const Token2 = await deployments.get("Token2");
     const DexSwap = await deploy("DexSwap", {
          from: deployer,
          args: [Token1.address, Token2.address],
          log: true,
          waitConfirmations: network.config.blockConfirmations || 1,
     });
     if (
          !developmentChains.includes(network.name) &&
          process.env.ETHERSCAN_API_KEY
     ) {
          await verify(DexSwap.address, []);
     }
     log("---------------------------------------------------------");
};
module.exports.tags = ["all", "DexSwap"];
