const { ethers } = require("hardhat");

const decmals = ethers.WeiPerEther; //1000000000000000000n
const zeroAddress = ethers.ZeroAddress;
const amount1Minted = 11111111111111111n * decmals;
const amount2Minted = 33333333333333333n * decmals;
const amount1Approved = 11111111111111111n * decmals;
const amount2Approved = 33333333333333333n * decmals;
const amount1Passed = 111111111111n * decmals;
const amount2Passed = 333333333333n * decmals;
const amountToSwap = 901n * decmals;

const developmentChains = ["hardhat", "localhost", "ganache"];

module.exports = {
     developmentChains,
     decmals,
     zeroAddress,
     amount1Minted,
     amount2Minted,
     amount1Approved,
     amount2Approved,
     amount1Passed,
     amount2Passed,
     amountToSwap,
};
