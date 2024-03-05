const getContracts = require("./DexSwap-GetContracts.js");

async function getReserve() {
     const { DexSwap } = await getContracts();
     const reserve1 = await DexSwap.getReserve1();
     const reserve2 = await DexSwap.getReserve2();
     const totalLiquidity = await DexSwap.getTotalLiquidity();
     console.log(`Reserve1: `, reserve1);
     console.log(`Reserve2: `, reserve2);
     console.log(`Total Liquidity: `, totalLiquidity);
     return { reserve1, reserve2, totalLiquidity };
}
module.exports = getReserve;
