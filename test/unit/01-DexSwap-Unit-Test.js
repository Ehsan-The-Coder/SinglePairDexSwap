const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config.js");
const { WeiPerEther } = require("ethers");

!(
     developmentChains.includes(network.name) &&
     (network.name == "localhost" || network.name == "hardhat")
)
     ? describe
     : describe("DexSwap Contract localhost/hardhat", function () {
            let DexSwap, Token1, Token2, deployer, deployers, txResponse;
            const decmals = ethers.WeiPerEther; //1000000000000000000n
            const zeroAddress = ethers.ZeroAddress;
            let amount1Minted = 111111111111n * decmals;
            let amount2Minted = 333333333333n * decmals;
            let amount1Approved = 11111111111n * decmals;
            let amount2Approved = 33333333333n * decmals;
            let amount1Passed = 1111111111n * decmals;
            let amount2Passed = 3333333333n * decmals;
            let amountToSwap = 1901n * decmals;
            const fee = 997n; //0.3%
            let totalLiquidity = 0n;
            let userShare = new Map();
            let reserve1 = 0n;
            let reserve2 = 0n;

            function Sqrt(bigIntN) {
                 if (bigIntN < 0n) {
                      throw new Error(
                           "Square root of negative numbers is not supported for BigInts.",
                      );
                 }
                 if (bigIntN === 0n || bigIntN === 1n) {
                      return bigIntN;
                 }
                 let left = 1n;
                 let right = bigIntN;

                 while (left <= right) {
                      const mid = (left + right) / 2n;
                      const midSquared = mid * mid;
                      if (midSquared === bigIntN) {
                           return mid;
                      } else if (midSquared < bigIntN) {
                           left = mid + 1n;
                      } else {
                           right = mid - 1n;
                      }
                 }
                 // If we didn't find an exact match, return the floor of the square root
                 return right;
            }
            async function deploy() {
                 try {
                      await deployments.fixture(["all"]);
                      DexSwap = await ethers.getContract("DexSwap", deployer);
                      Token1 = await ethers.getContract("Token1", deployer);
                      Token2 = await ethers.getContract("Token2", deployer);
                 } catch (error) {
                      console.log(error);
                 }
            }
            before(async function () {
                 deployers = await ethers.getSigners();
                 deployer = deployers[0];
                 await deploy();
            });
            describe("deploy", function () {
                 //already deployed
                 //but for testing puposes try to deploy new instance
                 //test custom error
                 it("expect to revert DexSwap__ZeroTokenAddress ", async function () {
                      const tempDexSwap =
                           await ethers.getContractFactory("DexSwap");
                      txResponse = tempDexSwap.deploy(zeroAddress, zeroAddress);
                      await expect(txResponse).to.be.revertedWithCustomError(
                           tempDexSwap,
                           "DexSwap__ZeroTokenAddress",
                      );
                      txResponse = tempDexSwap.deploy(
                           Token1.target,
                           zeroAddress,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           tempDexSwap,
                           "DexSwap__ZeroTokenAddress",
                      );
                      txResponse = tempDexSwap.deploy(
                           zeroAddress,
                           Token2.target,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           tempDexSwap,
                           "DexSwap__ZeroTokenAddress",
                      );
                 });
                 it("expect to revert DexSwap__IdenticalTokenAddress ", async function () {
                      const tempDexSwap =
                           await ethers.getContractFactory("DexSwap");
                      txResponse = tempDexSwap.deploy(
                           Token1.target,
                           Token1.target,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           tempDexSwap,
                           "DexSwap__IdenticalTokenAddress",
                      );
                 });
            });
            describe("constructor", function () {
                 it("sets the token addresses correctly", async function () {
                      const token1 = await DexSwap.i_token1();
                      const token2 = await DexSwap.i_token2();
                      assert.equal(token1, Token1.target);
                      assert.equal(token2, Token2.target);
                 });
            });
            describe("getPrice/getRatio check for zeroReserve", function () {
                 it("expect to be revert from getPrice with DexSwap__PoolIsEmpty", async function () {
                      //passing the invalid token address which is neither a token1 nor token2
                      txResponse = DexSwap.getPrice(
                           Token1.target,
                           amountToSwap,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__PoolIsEmpty",
                      );
                 });
                 it("expect to be revert from getRatio with DexSwap__PoolIsEmpty", async function () {
                      //passing the invalid token address which is neither a token1 nor token2
                      txResponse = DexSwap.getRatio(
                           Token1.target,
                           amountToSwap,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__PoolIsEmpty",
                      );
                 });
            });
            describe("addLiquidity function", function () {
                 it("expect the revert DexSwap__ValueCanNotBeZero if passed by amount zero", async function () {
                      txResponse = DexSwap.addLiquidity(
                           amount1Passed * 0n,
                           amount2Passed * 0n,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ValueCanNotBeZero",
                      );

                      txResponse = DexSwap.addLiquidity(
                           amount1Passed,
                           amount2Passed * 0n,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ValueCanNotBeZero",
                      );
                      txResponse = DexSwap.addLiquidity(
                           amount1Passed * 0n,
                           amount2Passed,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ValueCanNotBeZero",
                      );
                 });
                 it("expect the revert DexSwap__ERC20InsufficientBalance if user have low balance", async function () {
                      //as token not minted yet
                      // balance is zero
                      const token1Balacne = await Token1.balanceOf(
                           deployer.address,
                      );
                      const token2Balacne = await Token2.balanceOf(
                           deployer.address,
                      );
                      txResponse = DexSwap.addLiquidity(
                           amount1Passed,
                           amount2Passed,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ERC20InsufficientBalance",
                      );
                      //now mint token1
                      await Token1.mint(amount1Minted);
                      txResponse = DexSwap.addLiquidity(
                           amount1Passed,
                           amount2Passed,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ERC20InsufficientBalance",
                      );
                      //now first condition passed so make it false again to test 2nd
                      //amount1Minted+1 to make it false
                      //now mint token2
                      await Token2.mint(amount2Minted);
                      txResponse = DexSwap.addLiquidity(
                           amount1Minted + 1n,
                           amount2Passed,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ERC20InsufficientBalance",
                      );
                 });
                 it("expected the revert  DexSwap__AmountNotApproved when amount is not approved", async function () {
                      const token1Allowance = await Token1.allowance(
                           deployer.address,
                           DexSwap.target,
                      );
                      const token2Allowance = await Token2.allowance(
                           deployer.address,
                           DexSwap.target,
                      );
                      txResponse = DexSwap.addLiquidity(
                           amount1Passed,
                           amount2Passed,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__AmountNotApproved",
                      );

                      //now approve token1
                      await Token1.approve(DexSwap.target, amount1Approved);
                      txResponse = DexSwap.addLiquidity(
                           amount1Passed,
                           amount2Passed,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__AmountNotApproved",
                      );

                      //now first condition passed so make it false again to test 2nd
                      //amount1Approved+1 to make it false
                      //now approve token2
                      await Token2.approve(DexSwap.target, amount2Approved);
                      txResponse = DexSwap.addLiquidity(
                           amount1Approved + 1n,
                           amount2Passed,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__AmountNotApproved",
                      );
                 });
                 it("expected the revert  DexSwap__ERC20TransferFromFailed when transfer token fails", async function () {
                      //this is not directly possible but i am changing/mocking
                      //actual behaviour for testing
                      await Token1.setTransferFromReturnFalse(false);
                      await Token2.setTransferFromReturnFalse(false);

                      txResponse = DexSwap.addLiquidity(
                           amount1Passed,
                           amount2Passed,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ERC20TransferFromFailed",
                      );

                      //now true token1
                      await Token1.setTransferFromReturnFalse(true);
                      txResponse = DexSwap.addLiquidity(
                           amount1Passed,
                           amount2Passed,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ERC20TransferFromFailed",
                      );

                      //now true token2
                      await Token1.setTransferFromReturnFalse(false);
                      await Token2.setTransferFromReturnFalse(true);

                      txResponse = DexSwap.addLiquidity(
                           amount1Passed,
                           amount2Passed,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ERC20TransferFromFailed",
                      );

                      //set true for further test
                      await Token1.setTransferFromReturnFalse(true);
                 });
                 it("complete addliquidity test cycle1", async function () {
                      //expected values
                      const expReseve1 = amount1Passed;
                      const expReseve2 = amount2Passed;
                      const expUserShare = Sqrt(amount1Passed * amount2Passed);
                      const expTotalLiquidity = Sqrt(
                           amount1Passed * amount2Passed,
                      );

                      txResponse = DexSwap.addLiquidity(
                           amount1Passed,
                           amount2Passed,
                      );

                      await expect(txResponse)
                           .to.emit(DexSwap, "ShareChanged")
                           .withArgs(deployer.address, true, expUserShare);

                      await expect(txResponse)
                           .to.emit(DexSwap, "LiquidityChanged")
                           .withArgs(expTotalLiquidity, true);

                      await expect(txResponse)
                           .to.emit(DexSwap, "ReserveChanged")
                           .withArgs(
                                deployer.address,
                                true,
                                expReseve1,
                                expReseve2,
                           );
                      //final values
                      const finalReseve1 = await DexSwap.s_reserve1();
                      const finalReseve2 = await DexSwap.s_reserve2();
                      const finalTotalLiquidity =
                           await DexSwap.s_totalLiquidity();
                      const finalUserShare = await DexSwap.s_userShare(
                           deployer.address,
                      );
                      assert.equal(expReseve1, finalReseve1);
                      assert.equal(expReseve2, finalReseve2);
                      assert.equal(expTotalLiquidity, finalTotalLiquidity);
                      assert.equal(expUserShare, finalUserShare);
                      totalLiquidity = finalTotalLiquidity;
                      userShare.set(deployer.address, finalUserShare);
                      reserve1 = finalReseve1;
                      reserve2 = finalReseve2;
                 });
                 it("expect to DexSwap__NotProperRatio as pass improper ratio", async function () {
                      txResponse = DexSwap.addLiquidity(
                           //randomly making it improper
                           amount1Passed + 12n,
                           amount2Passed - 1n,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__NotProperRatio",
                      );
                 });
                 it("complete addliquidity test cycle2", async function () {
                      for (i = 1; i <= 5; i++) {
                           for (
                                deployerIndex = 0;
                                deployerIndex < deployers.length - 1;
                                //save one account for testing the last account
                                deployerIndex++
                           ) {
                                deployer = deployers[deployerIndex];
                                await Token1.connect(deployer).mint(
                                     amount1Minted,
                                );
                                await Token1.connect(deployer).approve(
                                     DexSwap.target,
                                     amount1Approved,
                                );
                                await Token2.connect(deployer).mint(
                                     amount2Minted,
                                );
                                await Token2.connect(deployer).approve(
                                     DexSwap.target,
                                     amount2Approved,
                                );
                                //expected values
                                const expReseve1 = BigInt(
                                     amount1Passed + reserve1,
                                );
                                const expReseve2 = BigInt(
                                     amount2Passed + reserve2,
                                );
                                //   min(
                                //        (amoutToken1 * s_totalLiquidity) / s_reserve1,
                                //        (amoutToken2 * s_totalLiquidity) / s_reserve2,
                                //   );
                                const R1 = BigInt(
                                     (amount1Passed * totalLiquidity) /
                                          reserve1,
                                );
                                const R2 = BigInt(
                                     (amount2Passed * totalLiquidity) /
                                          reserve2,
                                );
                                const currentUserShare = R1 < R2 ? R1 : R2;
                                const preUserShare = BigInt(
                                     userShare.get(deployer.address) ===
                                          undefined
                                          ? 0n
                                          : userShare.get(deployer.address),
                                );
                                const expUserShare =
                                     currentUserShare + preUserShare;
                                const expTotalLiquidity =
                                     totalLiquidity + currentUserShare;

                                txResponse = DexSwap.connect(
                                     deployer,
                                ).addLiquidity(amount1Passed, amount2Passed);

                                await expect(txResponse)
                                     .to.emit(DexSwap, "ShareChanged")
                                     .withArgs(
                                          deployer.address,
                                          true,
                                          currentUserShare,
                                     );

                                await expect(txResponse)
                                     .to.emit(DexSwap, "LiquidityChanged")
                                     .withArgs(expTotalLiquidity, true);

                                await expect(txResponse)
                                     .to.emit(DexSwap, "ReserveChanged")
                                     .withArgs(
                                          deployer.address,
                                          true,
                                          expReseve1,
                                          expReseve2,
                                     );

                                //final values

                                const finalReseve1 = await DexSwap.s_reserve1();
                                const finalReseve2 = await DexSwap.s_reserve2();
                                const finalTotalLiquidity =
                                     await DexSwap.s_totalLiquidity();
                                const finalUserShare =
                                     await DexSwap.s_userShare(
                                          deployer.address,
                                     );

                                assert.equal(expReseve1, finalReseve1);
                                assert.equal(expReseve2, finalReseve2);
                                assert.equal(expUserShare, finalUserShare);
                                assert.equal(
                                     expTotalLiquidity,
                                     finalTotalLiquidity,
                                );
                                totalLiquidity = finalTotalLiquidity;
                                userShare.set(deployer.address, finalUserShare);

                                reserve1 = finalReseve1;
                                reserve2 = finalReseve2;
                           }
                      }
                      deployer = deployers[0];
                 });
            });
            describe("getPrice function", function () {
                 it("expect to be revert with DexSwap__ZeroTokenAddress", async function () {
                      txResponse = DexSwap.getPrice(zeroAddress, amountToSwap);
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ZeroTokenAddress",
                      );
                 });
                 it("expect to be revert with DexSwap__InvalidTokenAddress", async function () {
                      //passing the invalid token address which is neither a token1 nor token2
                      txResponse = DexSwap.getPrice(
                           DexSwap.target,
                           amountToSwap,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__InvalidTokenAddress",
                      );
                 });
                 it("expect to be revert with DexSwap__ValueCanNotBeZero", async function () {
                      //passing the invalid token address which is neither a token1 nor token2
                      txResponse = DexSwap.getPrice(
                           Token1.target,
                           amountToSwap * 0n,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ValueCanNotBeZero",
                      );
                 });
                 it("getPrice by passing token1 as input", async function () {
                      const amountToSwapWithFee = (amountToSwap * fee) / 1000n;

                      const expAmountOut =
                           (reserve2 * amountToSwapWithFee) /
                           (reserve1 + amountToSwapWithFee);
                      const finalAmountOut = await DexSwap.getPrice(
                           Token1.target,
                           amountToSwap,
                      );
                      assert.equal(expAmountOut, finalAmountOut);
                 });
                 it("getPrice by passing token2 as input", async function () {
                      amountToSwap = 300n;
                      const amountToSwapWithFee = (amountToSwap * fee) / 1000n;
                      const expAmountOut =
                           (reserve1 * amountToSwapWithFee) /
                           (reserve2 + amountToSwapWithFee);
                      const finalAmountOut = await DexSwap.getPrice(
                           Token2.target,
                           amountToSwap,
                      );
                      assert.equal(expAmountOut, finalAmountOut);
                 });
            });
            describe("getRatio function", function () {
                 it("expect to be revert with DexSwap__ZeroTokenAddress", async function () {
                      txResponse = DexSwap.getRatio(zeroAddress, amountToSwap);
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ZeroTokenAddress",
                      );
                 });
                 it("expect to be revert with DexSwap__InvalidTokenAddress", async function () {
                      //passing the invalid token address which is neither a token1 nor token2
                      txResponse = DexSwap.getRatio(
                           DexSwap.target,
                           amountToSwap,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__InvalidTokenAddress",
                      );
                 });
                 it("expect to be revert with DexSwap__ValueCanNotBeZero", async function () {
                      //passing the invalid token address which is neither a token1 nor token2
                      txResponse = DexSwap.getRatio(
                           Token1.target,
                           amountToSwap * 0n,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ValueCanNotBeZero",
                      );
                 });
                 it("getRatio by passing token1 as input", async function () {
                      const expAmountOut = (reserve2 * amountToSwap) / reserve1;
                      const finalAmountOut = await DexSwap.getRatio(
                           Token1.target,
                           amountToSwap,
                      );
                      assert.equal(expAmountOut, finalAmountOut);
                 });
                 it("getRatio by passing token2 as input", async function () {
                      const expAmountOut = (reserve1 * amountToSwap) / reserve2;
                      const finalAmountOut = await DexSwap.getRatio(
                           Token2.target,
                           amountToSwap,
                      );
                      assert.equal(expAmountOut, finalAmountOut);
                 });
            });
            describe("swap", function () {
                 //in 1st test we expect using DexSwap.getPrice
                 //in 2nd tst we expect calculate our own
                 it("swap the assest by passing token1", async function () {
                      //deployers.length - 1 because this account has no balance and only for other test
                      for (i = 0; i < deployers.length - 1; i++) {
                           deployer = deployers[i];
                           amountToSwap += BigInt(i * i);
                           const expAmountOut = await DexSwap.getPrice(
                                Token1.target,
                                amountToSwap,
                           );
                           txResponse = DexSwap.connect(deployer).swap(
                                Token1.target,
                                amountToSwap,
                           );
                           await expect(txResponse)
                                .to.emit(DexSwap, "Swaped")
                                .withArgs(
                                     deployer.address,
                                     Token1.target,
                                     Token2.target,
                                     amountToSwap,
                                     expAmountOut,
                                );
                           reserve1 += amountToSwap;
                           reserve2 -= expAmountOut;

                           assert.equal(reserve1, await DexSwap.s_reserve1());
                           assert.equal(reserve2, await DexSwap.s_reserve2());
                      }
                 });
                 it("swap the assest by passing token2", async function () {
                      //deployers.length - 1 because this account has no balance and only for other test
                      for (i = 0; i < deployers.length - 1; i++) {
                           deployer = deployers[i];
                           amountToSwap += BigInt(i * i);
                           const amountToSwapWithFee =
                                (amountToSwap * fee) / 1000n;
                           const expAmountOut =
                                (reserve1 * amountToSwapWithFee) /
                                (reserve2 + amountToSwapWithFee);
                           const txResponse = DexSwap.connect(deployer).swap(
                                Token2.target,
                                amountToSwap,
                           );
                           await expect(txResponse)
                                .to.emit(DexSwap, "Swaped")
                                .withArgs(
                                     deployer.address,
                                     Token2.target,
                                     Token1.target,
                                     amountToSwap,
                                     expAmountOut,
                                );
                           reserve2 += amountToSwap;
                           reserve1 -= expAmountOut;

                           assert.equal(reserve1, await DexSwap.s_reserve1());
                           assert.equal(reserve2, await DexSwap.s_reserve2());
                      }
                 });
            });
            describe("removeLiquidity", function () {
                 it("expected to revert with DexSwap__ZeroUserShare ", async function () {
                      deployer = deployers[deployers.length - 1];
                      txResponse = DexSwap.connect(deployer).removeLiquidity();
                      await expect(txResponse).to.be.revertedWithCustomError(
                           DexSwap,
                           "DexSwap__ZeroUserShare",
                      );
                 });
                 it("removeLiquidity", async function () {
                      for (i = 1; i <= 5; i++) {
                           for (
                                deployerIndex = 0;
                                deployerIndex < deployers.length - 1;
                                deployerIndex++
                           ) {
                                deployer = deployers[deployerIndex];
                                //remove liquidity
                                //dx=X*S/T
                                //dy=Y*S/T
                                const expUserShare = BigInt(
                                     userShare.get(deployer.address) ==
                                          undefined
                                          ? 0
                                          : userShare.get(deployer.address),
                                );
                                if (expUserShare > 0) {
                                     const expAmountToken1 =
                                          (reserve1 * expUserShare) /
                                          totalLiquidity;
                                     const expAmountToken2 =
                                          (reserve2 * expUserShare) /
                                          totalLiquidity;
                                     const expReseve1 =
                                          reserve1 - expAmountToken1;
                                     const expReseve2 =
                                          reserve2 - expAmountToken2;
                                     const expTotalLiquidity =
                                          totalLiquidity - expUserShare;

                                     txResponse =
                                          await DexSwap.connect(
                                               deployer,
                                          ).removeLiquidity();

                                     await expect(txResponse)
                                          .to.emit(DexSwap, "ShareChanged")
                                          .withArgs(
                                               deployer.address,
                                               false,
                                               expUserShare,
                                          );

                                     await expect(txResponse)
                                          .to.emit(DexSwap, "LiquidityChanged")
                                          .withArgs(expTotalLiquidity, false);

                                     await expect(txResponse)
                                          .to.emit(DexSwap, "ReserveChanged")
                                          .withArgs(
                                               deployer.address,
                                               false,
                                               expReseve1,
                                               expReseve2,
                                          );

                                     //final values
                                     const finalReseve1 =
                                          await DexSwap.s_reserve1();
                                     const finalReseve2 =
                                          await DexSwap.s_reserve2();
                                     const finalTotalLiquidity =
                                          await DexSwap.s_totalLiquidity();
                                     const finalUserShare =
                                          await DexSwap.s_userShare(
                                               deployer.address,
                                          );
                                     assert.equal(expReseve1, finalReseve1);
                                     assert.equal(expReseve2, finalReseve2);
                                     assert.equal(0n, finalUserShare);
                                     assert.equal(
                                          expTotalLiquidity,
                                          finalTotalLiquidity,
                                     );
                                     totalLiquidity = finalTotalLiquidity;
                                     userShare.delete(deployer.address);

                                     reserve1 = finalReseve1;
                                     reserve2 = finalReseve2;
                                }
                           }
                      }
                      deployer = deployers[0];
                      //final values
                 });
            });
       });
