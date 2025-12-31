//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import "../Launchpad.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IUniswapV2Pair.sol";
import "../library/Power.sol";

library LaunchPadCore {

    /**
     * @dev Calculate purchase return using Bancor formula (improved version)
     */

    uint32 public constant MAX_RESERVE_RATIO = 1000000;

    function _calculatePurchaseReturn(
        uint256 _supply,
        uint256 _reserveBalance,
        uint32 _reserveRatio,
        uint256 _depositAmount
    ) internal pure returns (uint256) {
        if (_depositAmount == 0) return 0;

        require(
            _supply > 0 &&
                _reserveRatio > 0 &&
                _reserveRatio <= MAX_RESERVE_RATIO,
            "Invalid bonding curve parameters"
        );

        // Handle first purchase
        if (_reserveBalance == 0) {
            // Linear pricing for first purchase to bootstrap the curve
            return _depositAmount * (10 ** 12); // Convert USDC (6 decimals) to token scale (18 decimals)
        }

        // Special case for 100% reserve ratio (linear bonding curve)
        if (_reserveRatio == MAX_RESERVE_RATIO) {
            return _supply * _depositAmount / _reserveBalance;
        }

        // Calculate using Bancor power function
        uint256 result;
        uint8 precision;
        uint256 baseN = _depositAmount + _reserveBalance;

        (result, precision) = PowerLib.power(
            baseN,
            _reserveBalance,
            _reserveRatio,
            MAX_RESERVE_RATIO
        );

        uint256 newTokenSupply = _supply * result >> precision;
        return newTokenSupply > _supply ? newTokenSupply - _supply : 0;}
        /**
     * @dev Calculate exact USDC needed for remaining tokens (simplified for this example)
     */
    function _calculateExactUsdcForTokens(
        Launchpad.Campaign storage campaign,
        uint256 remainingTokens
    ) internal view returns (uint256) {
        // This is a simplified calculation - in production, you'd want more precise math
        uint256 avgPrice = campaign.targetAmount * (10 ** 18) / campaign.tokensForSale;
        return remainingTokens * avgPrice / (10 ** 18);
    }

}