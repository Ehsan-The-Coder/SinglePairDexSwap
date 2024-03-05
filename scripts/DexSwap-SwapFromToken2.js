const getContracts = require("../utils/DexSwap-GetContracts.js");
let {
     amount1Minted,
     amount2Minted,
     amount1Approved,
     amount2Approved,
     amountToSwap,
} = require("../helper-hardhat-config.js");
const getReserve = require("../utils/DexSwap-GetReserve.js");
const { ethers } = require("hardhat");
let DexSwap;
let Token1;
let Token2;
let signers;
let signer;

async function swap(signerIndex) {
     signers = await ethers.getSigners();
     signer = signers[signerIndex];
     await mintAndApprove();

     console.log(`Detail of reserve(s) before swap...`);
     await getReserve();

     const txResponse = await DexSwap.connect(signer).swap(
          Token2.target,
          amountToSwap,
     );
     const txReceipt = await txResponse.wait(1);
     const amountOut = txReceipt.logs[2].args.amountOut;

     console.log(
          `Swapped Amount In: ${amountToSwap}, Amount Out: ${amountOut}`,
     );

     console.log(`Detail of reserve(s) after swap...`);
     await getReserve();
}

// Get the index from an environment variable
//$env:signer="1"; yarn hardhat run .\scripts\DexSwap-AddLiquidity.js
const index = process.env.signer;

swap(index)
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
