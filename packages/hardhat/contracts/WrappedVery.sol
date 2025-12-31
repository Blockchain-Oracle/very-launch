//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title WrappedVery
 * @dev Wrapped VERY token with 6 decimals (for compatibility with launchpad bonding curve).
 *      This is a FAUCET contract - anyone can mint tokens for testing.
 *      This represents wrapped VERY tokens that can be used in the launchpad ecosystem.
 */
contract WrappedVery is ERC20 {
    // Cooldown mapping to prevent spam (1 hour between mints per address)
    mapping(address => uint256) public lastMintTime;
    uint256 public constant MINT_COOLDOWN = 1 hours;
    uint256 public constant MINT_AMOUNT = 50000e6; // 50,000 WVERY per mint

    /**
     * @dev Initializes the contract by setting the name and symbol for the token,
     *      and minting an initial supply to the deployer.
     */
    constructor() ERC20("Wrapped VERY", "WVERY") {
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
     * @dev FAUCET: Anyone can mint 50,000 WVERY tokens to themselves.
     *      Has a 1 hour cooldown to prevent abuse.
     */
    function faucet() public {
        require(
            block.timestamp >= lastMintTime[msg.sender] + MINT_COOLDOWN,
            "Faucet cooldown: please wait before minting again"
        );
        lastMintTime[msg.sender] = block.timestamp;
        _mint(msg.sender, MINT_AMOUNT);
    }

    /**
     * @dev Legacy mint function for backwards compatibility with scripts.
     *      Anyone can call - mints amount * 50000e6 to the specified address.
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount * 50000e6);
    }
}
