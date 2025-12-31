//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WrappedVery
 * @dev Wrapped VERY token with 6 decimals (for compatibility with launchpad bonding curve).
 *      The deployer of the contract becomes the owner and can mint new tokens.
 *      This represents wrapped VERY tokens that can be used in the launchpad ecosystem.
 */
contract WrappedVery is ERC20, Ownable {
    /**
     * @dev Initializes the contract by setting the name and symbol for the token,
     *      and minting an initial supply to the deployer.
     */
    constructor() ERC20("Wrapped VERY", "WVERY") Ownable(msg.sender) {
        // Mint the initial supply to the contract deployer (100,000 WVERY)
        _mint(msg.sender, 100000e6);
    }

    /**
     * @dev Overrides the default 18 decimals of ERC20 to 6 for launchpad compatibility.
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    /**
     * @dev Mints `amount` tokens to `to`.
     *
     * Requirements:
     *
     * - the caller must be the owner of the contract.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(msg.sender == owner(), "you are not owner");
        _mint(to, amount * 50000e6);
    }
}
