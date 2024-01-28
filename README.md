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

1. Clone the repository and navigate to the newly created folder:
     ```bash
     git clone https://github.com/EhsanTheCoderr/SinglePairDexSwap.git
     cd SinglePairDexSwap
     ```
2. Install the dependencies:
     ```bash
      yarn
     ```
3. Compile the smart contracts:
     ```bash
      yarn hardhat compile
     ```
4. Deploy the contracts:
     ```bash
     yarn hardhat deploy
     ```

## Running the tests

To run the tests, use the following command:

```bash
yarn hardhat test
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
