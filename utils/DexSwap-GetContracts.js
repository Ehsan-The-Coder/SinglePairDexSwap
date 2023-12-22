const { ethers } = require("hardhat");

async function getContracts() {
     const signers = await ethers.getSigners();
     const DexSwap = await ethers.getContract("DexSwap", signers[0]);
     const Token1 = await ethers.getContract("Token1", signers[0]);
     const Token2 = await ethers.getContract("Token2", signers[0]);
     return { DexSwap, Token1, Token2 };
}

module.exports = getContracts;
