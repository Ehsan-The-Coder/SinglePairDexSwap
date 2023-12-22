const getContracts = require("./DexSwap-GetContracts.js");

async function getReserve() {
     const { DexSwap } = await getContracts();
     const reserve1 = await DexSwap.s_reserve1();
     const reserve2 = await DexSwap.s_reserve2();
     const totalLiquidity = await DexSwap.s_totalLiquidity();
     console.log(`Reserve1: `, reserve1);
     console.log(`Reserve2: `, reserve2);
     console.log(`Total Liquidity: `, totalLiquidity);
     return { reserve1, reserve2, totalLiquidity };
}
module.exports = getReserve;
