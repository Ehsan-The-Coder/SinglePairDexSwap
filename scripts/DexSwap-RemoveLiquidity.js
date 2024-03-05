const getContracts = require("../utils/DexSwap-GetContracts.js");
const getReserve = require("../utils/DexSwap-GetReserve.js");
const { ethers } = require("hardhat");
let DexSwap;
let signers;
let signer;

async function RemoveLiquidity(signerIndex) {
     signers = await ethers.getSigners();
     signer = signers[signerIndex];
     DexSwap = (await getContracts()).DexSwap;

     console.log(`Detail of reserve(s) before removing liquidity...`);
     await getReserve();
     let userShare = await DexSwap.getUserShare(signer.address);
     console.log(`User Share[${signer.address}]: `, userShare);

     await DexSwap.connect(signer).removeLiquidity();

     console.log(`Detail of reserve(s) after removing liquidity...`);
     await getReserve();
}

// Get the index from an environment variable
//$env:signer="1"; yarn hardhat run .\scripts\DexSwap-AddLiquidity.js
const index = process.env.signer;

RemoveLiquidity(index)
     .then(() => process.exit(0))
     .catch((error) => {
          console.log(error);
          process.exit(1);
     });
