# SinglePairDexSwap

SinglePairDexSwap is a decentralized exchange (DEX) built on the Ethereum blockchain. It allows users to swap single pair of ERC20 tokens directly from their wallets in a permissionless and decentralized manner.

## Features

-    **ERC20 Token Swapping:** Swap any ERC20 tokens directly from your wallet.
-    **Liquidity Provision:** Users can add liquidity to the pool and earn fees.
-    **Automated Market Making (AMM):** SinglePairDexSwap uses the constant product formula for automated market making.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-    Node.js and npm or yarn
-    Hardhat
-    Ethereum wallet

### Installation

1.   Clone the repository and navigate to the newly created folder:
     ```bash
     git clone https://github.com/EhsanTheCoderr/SinglePairDexSwap.git
     cd SinglePairDexSwap
     ```
2.   Install the dependencies:
     ```bash
      yarn
     ```
3.   Compile the smart contracts:
     ```bash
      yarn hardhat compile
     ```
4.   Deploy the contracts:
     ```bash
     yarn hardhat deploy
     ```

## Running the tests

To run the tests, use the following command:

```bash
yarn hardhat test
```

## Run the scripts

Note: Please ensure that the contract is deployed on localhost/ganache/testnet and the node is running properly before running the script. Set the environment variable `$env:signer` to the desired account index before executing the scripts.

1. Add Liquidity:

     ```bash
     $env:signer="0"; yarn hardhat run ./scripts/DexSwap-AddLiquidity.js --network localhost
     ```

2. Swap Token1 or Token2 by selecting the file name:

     ```bash
     $env:signer="0"; yarn hardhat run .\scripts\DexSwap-SwapFromToken1.js --network localhost
     ```

3. Remove Liquidity:

     ```bash
     $env:signer="0"; yarn hardhat run .\scripts\DexSwap-RemoveLiquidity.js --network localhost
     ```

## Built With

-    [Solidity](https://soliditylang.org/) - Ethereum's smart contract language
-    [Hardhat](https://hardhat.org/) - Ethereum development environment
-    [OpenZeppelin](https://openzeppelin.com/) - Library for secure smart contract development

## License

This project is licensed under the MIT License.

## Acknowledgments

-    Ethereum Foundation
-    OpenZeppelin
