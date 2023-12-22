// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {console} from "hardhat/console.sol";

//❎ This is just for testing purposes don't implement it
//❎  becuse it has many security issue
contract Token2 is ERC20 {
     //when this value is false it will not call the actual transfer
     //and just return false it is just for testing
     bool public setTransferFromReturn = true;

     constructor() ERC20("Token2", "Token2") {}

     function mint(uint256 value) public {
          _mint(msg.sender, value);
     }

     function setTransferFromReturnFalse(bool value) public {
          setTransferFromReturn = value;
     }

     function transferFrom(
          address from,
          address to,
          uint256 value
     ) public override returns (bool) {
          if (setTransferFromReturn) {
               ERC20.transferFrom(from, to, value);
               return true;
          } else {
               return false;
          }
     }

     function burn() public {
          _burn(msg.sender, balanceOf(msg.sender));
     }
}
