const getContracts = require("../utils/DexSwap-GetContracts.js");
let {
     amount1Minted,
     amount2Minted,
     amount1Approved,
     amount2Approved,
     amount1Passed,
     amount2Passed,
} = require("../helper-hardhat-config.js");
const getReserve = require("../utils/DexSwap-GetReserve.js");
const { ethers } = require("hardhat");
let DexSwap;
let Token1;
let Token2;
let signers;
let signer;

async function AddLiquidity(signerIndex) {
     signers = await ethers.getSigners();
     signer = signers[signerIndex];

     await mintAndApprove();

     console.log(`Detail of reserve(s) before adding liquidity...`);
     let totalLiquidity = (await getReserve()).totalLiquidity;
     let userShare = await DexSwap.s_userShare(signer.address);
     console.log(`User Share[${signer.address}]: `, userShare);

     if (totalLiquidity > 0) {
          amount2Passed = await DexSwap.getRatio(Token1.target, amount1Passed);
     }
     await DexSwap.connect(signer).addLiquidity(amount1Passed, amount2Passed);

     console.log(`Detail of reserve(s) after adding liquidity...`);
     await getReserve();
     userShare = await DexSwap.s_userShare(signer.address);
     console.log(`User Share[${signer.address}]: `, userShare);
}

// Get the index from an environment variable
const index = process.env.signer;

AddLiquidity(index)
     .then(() => process.exit(0))
     .catch((error) => {
          console.log(error);
          process.exit(1);
     });

async function mintAndApprove() {
     DexSwap = (await getContracts()).DexSwap;
     Token1 = (await getContracts()).Token1;
     Token2 = (await getContracts()).Token2;

     await Token1.connect(signer).mint(amount1Minted);
     await Token2.connect(signer).mint(amount2Minted);

     await Token1.connect(signer).approve(DexSwap.target, amount1Approved);
     await Token2.connect(signer).approve(DexSwap.target, amount2Approved);
}
