//SPDX-License-Identifier:MIT
pragma solidity 0.8.22;

//<----------------------------import statements---------------------------->
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SwapFunction} from "./utils/SwapFunction.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {console} from "hardhat/console.sol";

/**
 * @title A decentralized exchange for swapping ERC20 tokens.
 * @author Muhammad Ehsan
 * Some common terminologies to remember are below
 * dx=amount of token1, dy=amount of token1, X=reserve of token1, S=Share of user,T=total Liquidity
 * @dev DexSwap uses the constant product formula for AMM X*Y=K
 * @dev How much share to mint on add liquidity? get minimum of S=dx*T/X; S=dy*T/Y for safety
 * @dev How much token user get on removal of liquidity? dx=X*S/T; dy=Y*S/T
 * @dev How much token user get on swap ? dx=Xdy/(Y+dy); dy=Ydx/(X+dx)
 * @dev How to get proper ratio for adding liquidity? dx=Xdy/Y; dy=Ydx/X
 * @notice We are not goining to comment on every single time because it's to toward much duplications
 */
contract DexSwap is ReentrancyGuard {
     //<----------------------------state variable---------------------------->
     IERC20 public immutable i_token1;
     IERC20 public immutable i_token2;
     uint256 public s_reserve1;
     uint256 public s_reserve2;
     uint256 public s_totalLiquidity;
     uint32 public constant SWAP_FEE_FRACTION = 997; // Fee for the swap operation, represented as a fraction over 1000.
     mapping(address user => uint256 share) public s_userShare;

     //<----------------------------events---------------------------->
     /**
      * @dev Emits when the share of a user changes.
      */
     event ShareChanged(address indexed user, bool isAdded, uint256 share);
     /**
      * @dev Emits when the total liquidity changes.
      */
     event LiquidityChanged(uint256 totalLiquidity, bool isAdded);
     /**
      * @dev Emits when the reserve changes.
      */
     event ReserveChanged(
          address indexed user,
          bool isAdded,
          uint256 amount1,
          uint256 amount2
     );
     event Swaped(
          address user,
          IERC20 tokenIn,
          IERC20 tokenOut,
          uint256 amountIn,
          uint256 amountOut
     );

     //<----------------------------custom errors---------------------------->
     error DexSwap__ValueCanNotBeZero(uint256 value);
     error DexSwap__NotProperRatio(uint256 value1, uint256 value2);
     error DexSwap__AmountNotApproved(IERC20 token, uint256 value);
     error DexSwap__IdenticalTokenAddress(IERC20 token1, IERC20 token2);
     error DexSwap__ZeroTokenAddress(IERC20 token);
     error DexSwap__ERC20InsufficientBalance(IERC20 token, uint256 value);
     error DexSwap__ERC20TransferFromFailed(
          address allowancer,
          address spender,
          IERC20 token,
          uint256 value
     );
     error DexSwap__ERC20TransferFrom(
          address owner,
          IERC20 token,
          uint256 value
     );
     error DexSwap__ZeroUserShare(uint256 value);
     error DexSwap__InvalidTokenAddress(IERC20 token);
     error DexSwap__PoolIsEmpty();
     error DexSwap__AmountBiggerThanReserve(uint256 value1, uint256 value2);

     //<----------------------------modifiers---------------------------->
     /**
      * @dev Modifier to check if the token addresses are same.
      * if they are then revert.
      * @param token1 The address of the first token.
      * @param token2 The address of the second token.
      */
     modifier identicalTokenAddresses(IERC20 token1, IERC20 token2) {
          if (token1 == token2) {
               revert DexSwap__IdenticalTokenAddress(token1, token2);
          }
          _;
     }
     /**
      * @dev Modifier to check if the token address is zero.
      * if token address is zero it will revert
      * @param token The address of the token.
      */
     modifier zeroTokenAddress(IERC20 token) {
          if (address(token) == address(0)) {
               revert DexSwap__ZeroTokenAddress(token);
          }
          _;
     }
     /**
      * @dev Modifier to check if the token address is valid.
      * if token address not equal to any from i_token1 or i_token2
      * it will revert
      * @param token The address of the token.
      */
     modifier validTokenAddress(IERC20 token) {
          if (token != i_token1 && token != i_token2) {
               revert DexSwap__InvalidTokenAddress(token);
          }
          _;
     }
     /**
      * @dev Modifier to check if the amount is zero then revert
      * @param amount The value user has passed
      */
     modifier nonZeroAmount(uint256 amount) {
          if (amount == 0) {
               revert DexSwap__ValueCanNotBeZero(amount);
          }
          _;
     }
     /**
      * @dev Modifier to check weather user is passing proper ratio of each token
      * if he don't know the proper ratio he get from getRatio() function
      * @param amount1 1st token value
      * @param amount2 2nd token value
      */
     modifier notProperRatio(uint256 amount1, uint256 amount2) {
          if (s_totalLiquidity > 0) {
               if (amount2 != getRatio(i_token1, amount1)) {
                    revert DexSwap__NotProperRatio(amount1, amount2);
               }
          }
          _;
     }
     /** @dev checks weather the amount user pass is approve to address(this)
      * so we can transfer it
      * @param token address of the token against which check allowance
      * @param amount value
      */
     modifier isAmountApproved(IERC20 token, uint256 amount) {
          if (token.allowance(msg.sender, address(this)) < amount)
               revert DexSwap__AmountNotApproved(token, amount);
          _;
     }
     /** @dev verify that atleast user has balance sending to us
      * @param token address of the token against which we want to check
      * @param amount value fo the  token
      */
     modifier hasBalance(IERC20 token, uint256 amount) {
          if (token.balanceOf(msg.sender) < amount)
               revert DexSwap__ERC20InsufficientBalance(token, amount);
          _;
     }
     /**
      * @dev checks taht pool is empty or has balance
      */
     modifier zeroReserve() {
          if (s_reserve1 == 0 || s_reserve2 == 0) {
               revert DexSwap__PoolIsEmpty();
          }
          _;
     }

     //<----------------------------functions---------------------------->
     //<----------------------------constructor---------------------------->
     /**
      * @dev Take two token addresses and validate before save
      * @param token1 1st token for the pool
      * @param token2 2nd token for the pool
      */
     constructor(
          IERC20 token1,
          IERC20 token2
     )
          zeroTokenAddress(token1)
          zeroTokenAddress(token2)
          identicalTokenAddresses(token1, token2)
     {
          i_token1 = token1;
          i_token2 = token2;
     }

     //<----------------------------external functions---------------------------->
     /**
      * @notice Add liquidity to the pool.
      * @dev This function will revert if the amounts are zero, the caller has insufficient balance, the amounts are not approved, the transfer fails, or the amounts are not in the proper ratio.
      * @param amountToken1 The amount of token1 to add.
      * @param amountToken2 The amount of token2 to add.
      */
     function addLiquidity(
          uint256 amountToken1,
          uint256 amountToken2
     )
          external
          nonReentrant
          nonZeroAmount(amountToken1)
          nonZeroAmount(amountToken2)
          hasBalance(i_token1, amountToken1)
          hasBalance(i_token2, amountToken2)
          isAmountApproved(i_token1, amountToken1)
          isAmountApproved(i_token2, amountToken2)
          notProperRatio(amountToken1, amountToken2)
     {
          _addLiquidity(amountToken1, amountToken2);
     }

     /**
      * @notice external function to exchange tokens
      * @dev This function checks for multiple revert if want check every single specifically
      * @param tokenIn The address of the token user hold
      * @param amountIn The total amount of assest user want to exchanges
      */
     function swap(
          IERC20 tokenIn,
          uint256 amountIn
     )
          external
          zeroTokenAddress(tokenIn)
          validTokenAddress(tokenIn)
          nonZeroAmount(amountIn)
          zeroReserve
          hasBalance(tokenIn, amountIn)
          isAmountApproved(tokenIn, amountIn)
     {
          _swap(tokenIn, amountIn);
     }

     /**
      * @notice Remove liquidity from the pool.
      * @dev This function will revert if the user has no share or
      * his share amount is greater thran pool reserve
      */
     function removeLiquidity() external nonReentrant {
          uint256 userShare = s_userShare[msg.sender];
          if (userShare == 0) {
               revert DexSwap__ZeroUserShare(0);
          }
          uint256 amountToken1 = (s_reserve1 * userShare) / s_totalLiquidity;
          uint256 amountToken2 = (s_reserve2 * userShare) / s_totalLiquidity;
          //validates that 2nd value is always bigger either revert
          _checkAmount(amountToken1, s_reserve1);
          _checkAmount(amountToken2, s_reserve2);
          _checkAmount(amountToken1, i_token1.balanceOf(address(this)));
          _checkAmount(amountToken2, i_token2.balanceOf(address(this)));
          //remove from the user userShare
          _burnShare(userShare);
          //transfer user amount to him
          _transferTokenOther(i_token1, amountToken1);
          _transferTokenOther(i_token2, amountToken2);

          s_reserve1 -= amountToken1;
          s_reserve2 -= amountToken2;

          emit ShareChanged(msg.sender, false, userShare);
          emit LiquidityChanged(s_totalLiquidity, false);
          emit ReserveChanged(msg.sender, false, s_reserve1, s_reserve2);
     }

     //<----------------------------external/public view/pure functions---------------------------->
     /**
      * @notice Give you price of one asset interm of other fee is also deducted from
      * @dev This function will revert if the user address in not valid, pool is empty and amountIn is zero
      * @param tokenIn The address of the tokenIn is a token user(own) have in its wallet
      * @param amountIn The amount of tokenIn which user hold.
      */
     function getPrice(
          IERC20 tokenIn,
          uint256 amountIn
     )
          external
          view
          zeroTokenAddress(tokenIn)
          validTokenAddress(tokenIn)
          nonZeroAmount(amountIn)
          zeroReserve
          returns (uint256 amountOut)
     {
          //deduct fee from here
          amountIn = (amountIn * SWAP_FEE_FRACTION) / 1000;
          bool isToken1 = tokenIn == i_token1;
          if (isToken1) {
               amountOut = (s_reserve2 * amountIn) / (s_reserve1 + amountIn);
          } else {
               amountOut = (s_reserve1 * amountIn) / (s_reserve2 + amountIn);
          }
     }

     /**
      * @notice Give you ratio of one asset in terms of other
      * @dev This function will revert if the user address in not valid, pool is empty and amountIn is zero
      * @param tokenIn The address of the tokenIn is a token user(own) have in its wallet
      * @param amountIn The amount of tokenIn which user hold.
      */
     function getRatio(
          IERC20 tokenIn,
          uint256 amountIn
     )
          public
          view
          zeroTokenAddress(tokenIn)
          validTokenAddress(tokenIn)
          nonZeroAmount(amountIn)
          zeroReserve
          returns (uint256 amountOut)
     {
          bool isToken1 = tokenIn == i_token1;
          if (isToken1) {
               amountOut = (s_reserve2 * amountIn) / s_reserve1;
          } else {
               amountOut = (s_reserve1 * amountIn) / s_reserve2;
          }
     }

     //<----------------------------private functions---------------------------->
     /**
      * @notice addLiquidity() function is divided into to part due to stack too deep
      * @dev This function will revert if the amounts are zero, the caller has insufficient balance, the amounts are not approved, the transfer fails, or the amounts are not in the proper ratio.
      * @param amountToken1 The amount of token1 to add.
      * @param amountToken2 The amount of token2 to add.
      */
     function _addLiquidity(
          uint256 amountToken1,
          uint256 amountToken2
     ) private {
          _transferTokenToUs(i_token1, amountToken1);
          _transferTokenToUs(i_token2, amountToken2);
          uint256 userShare;
          if (s_totalLiquidity == 0) {
               userShare = SwapFunction.sqrt(amountToken1 * amountToken2);
          } else {
               //Share=Amount X*totalLiquidity/Reseve X
               // Share=Amount Y*totalLiquidity/Reseve Y
               userShare = SwapFunction.min(
                    (amountToken1 * s_totalLiquidity) / s_reserve1,
                    (amountToken2 * s_totalLiquidity) / s_reserve2
               );
          }
          if (userShare == 0) {
               revert DexSwap__ZeroUserShare(userShare);
          }
          _mintShare(userShare);
          //udpate the reserve
          s_reserve1 += amountToken1;
          s_reserve2 += amountToken2;

          emit ShareChanged(msg.sender, true, userShare);
          emit LiquidityChanged(s_totalLiquidity, true);
          emit ReserveChanged(msg.sender, true, s_reserve1, s_reserve2);
     }

     /**
      * @notice swap() function is divided into to part due to stack too deep
      * @param tokenIn token address of the user hold
      * @param amountIn amount of the assest user want to exchange
      */
     function _swap(IERC20 tokenIn, uint256 amountIn) private {
          IERC20 tokenOut;
          uint256 reserveIn;
          uint256 reserveOut;

          bool isToken1 = tokenIn == i_token1;
          (tokenIn, tokenOut, reserveIn, reserveOut) = isToken1
               ? (i_token1, i_token2, s_reserve1, s_reserve2)
               : (i_token2, i_token1, s_reserve2, s_reserve1);
          {
               uint amountInWithFee = (amountIn * SWAP_FEE_FRACTION) / 1000;
               uint256 amountOut = (reserveOut * amountInWithFee) /
                    (reserveIn + amountInWithFee);
               //validate 2nd value must bigger thant 1st
               _checkAmount(amountOut, reserveOut);
               //transfer tokens
               _transferTokenToUs(tokenIn, amountIn);
               _transferTokenOther(tokenOut, amountOut);

               if (isToken1) {
                    s_reserve1 += amountIn;
                    s_reserve2 -= amountOut;
               } else {
                    s_reserve2 += amountIn;
                    s_reserve1 -= amountOut;
               }
               emit Swaped(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
          }
     }

     /** @dev Transfer assets to address(this) if fail revert
      * @param token address of the token
      * @param amount token value
      */
     function _transferTokenToUs(IERC20 token, uint256 amount) private {
          if (!(token.transferFrom(msg.sender, address(this), amount))) {
               revert DexSwap__ERC20TransferFromFailed(
                    msg.sender,
                    address(this),
                    token,
                    amount
               );
          }
     }

     /** @dev Transfer assets from address(this) to user address if fails revert
      * @param token address of the token
      * @param amount token value
      */
     function _transferTokenOther(IERC20 token, uint256 amount) private {
          if (!(token.transfer(msg.sender, amount))) {
               revert DexSwap__ERC20TransferFrom(msg.sender, token, amount);
          }
     }

     /**
      * @dev mint share for the user also from total Liquidity
      * @param share mint the amount user share
      */
     function _mintShare(uint256 share) private {
          s_userShare[msg.sender] += share;
          s_totalLiquidity += share;
     }

     /**
      * @dev burn share the user hold also from total Liquidity
      * @param share burn the amount user hold
      */
     function _burnShare(uint256 share) private {
          s_userShare[msg.sender] -= share;
          s_totalLiquidity -= share;
     }

     //<----------------------------private view/pure functions---------------------------->
     /**
      * @notice check that provided amount has enough amount against reserve
      * @dev this function will check @param amountToken1 > @param reserve1 then revert or @param amountToken2 > @param reserve2
      * @param amountToken amount of userShare of token
      * @param reserve amount of total reserve
      * his share amount is greater thran pool reserve
      */
     function _checkAmount(uint256 amountToken, uint256 reserve) private pure {
          if (amountToken > reserve) {
               revert DexSwap__AmountBiggerThanReserve(amountToken, reserve);
          }
     }
}
