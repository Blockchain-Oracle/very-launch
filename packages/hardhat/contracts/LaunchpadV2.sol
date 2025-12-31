//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./library/LaunchpadCore.sol";
import "./Token.sol";

import "./interfaces/IUniswapV2Router.sol";
import "./interfaces/IUniswapV2Factory.sol";

struct CampaignInfo {
    uint256 id;
    address creator;
    uint256 targetAmount;
    uint256 amountRaised;
    uint256 tokensSold;
    uint256 totalSupply;
    uint256 tokensForSale;
    uint256 creatorAllocation;
    uint256 liquidityAllocation;
    uint256 platformFeeTokens;
    uint256 deadline;
    address tokenAddress;
    bool isActive;
    bool isFundingComplete;
    bool isCancelled;
    string name;
    string symbol;
    string description;
    uint32 reserveRatio;
    uint256 blockNumberCreated;
    uint256 promotionalOgPoints;
    bool isPromoted;
    address uniswapPair;
}
struct Campaign {
    uint256 id;
    address creator;
    uint256 targetAmount;
    uint256 amountRaised;
    uint256 tokensSold;
    uint256 totalSupply;
    uint256 tokensForSale;
    uint256 creatorAllocation;
    uint256 liquidityAllocation;
    uint256 platformFeeTokens;
    uint256 deadline;
    IERC20 token;
    bool isActive;
    bool isFundingComplete;
    bool isCancelled;
    string name;
    string symbol;
    string description;
    uint32 reserveRatio;
    address uniswapPair;
    uint256 blockNumberCreated;
    uint256 promotionalOgPoints;
    bool isPromoted;
    mapping(address => uint256) investments;
}

interface IParentContract {
    function getSummaryStats()
        external
        view
        returns (
            uint256 totalCampaigns,
            uint256 activeCampaigns,
            uint256 completedCampaigns,
            uint256 cancelledCampaigns,
            uint256 expiredCampaigns,
            uint256 totalFundingRaised
        );

    function campaignCount() external view returns (uint32);

    function campaigns(uint256) external view returns (CampaignInfo memory);

    function _getCampaignInfo(uint32) external view returns (CampaignInfo memory);

    function usdcToken() external view returns (IERC20);

    function userParticipatedCampaigns(address) external view returns (uint32[] memory);

    function creatorCampaigns(address) external view returns (uint32[] memory);

    function getUserInvestment(uint32 campaignId, address user) external view returns (uint128);
}

contract LaunchpadV2 is ReentrancyGuard {

    using SafeERC20 for IERC20;

    IParentContract parentContract;
    // uint256 campaignCount = IParentContract(parentContract).campaignCount();
    IERC20 public usdcToken;
    IUniswapV2Router public uniswapRouter;
    IUniswapV2Factory public uniswapFactory;

    error ZeroValueNotAllowed();
    error ReserveRatioOutOfBounds();
    error CampaignInactive();
    error FundingAlreadyCompleted();
    error FundingNotMet();
    error InvalidParameters();
    error NotCampaignOwner();
    error NotEnoughTokens();
    error InsufficientFunds();
    error AddressZeroDetected();
    error InvalidSupply();
    error CampaignDoesNotExist();
    error DeadlineExpired();
    error DeadlineTooShort();
    error UserCannotClaimRefund();
    error Unauthorized();
    error InvalidInput();

    event CampaignCancelled(
        uint256 indexed campaignId,
        address indexed creator
    );

    event RefundClaimed(
        uint256 indexed campaignId,
        address indexed investor,
        uint256 amount
    );


    constructor(address _parentContract, address _usdcToken, address _uniswapRouter, address _uniswapFactory) {
        parentContract = IParentContract(_parentContract);
        usdcToken = IERC20(_usdcToken);
        uniswapRouter = IUniswapV2Router(_uniswapRouter);
        uniswapFactory = IUniswapV2Factory(_uniswapFactory);
    }

   /**
     * @dev Swap campaign token for USDC using Uniswap pool
     * @param _campaignId ID of the campaign
     * @param _tokenAmount Amount of tokens to swap
     * @param _minUsdcOut Minimum USDC expected (for slippage protection)
     * @param _deadline Transaction deadline
    */
    function swapTokenForUsdc(
        uint32 _campaignId,
        uint256 _tokenAmount,
        uint256 _minUsdcOut,
        uint256 _deadline
    ) external nonReentrant {
        uint256 campaignCount = IParentContract(parentContract).campaignCount();
        if (_campaignId == 0 || _campaignId > campaignCount)
            revert CampaignDoesNotExist();
        if (_tokenAmount == 0) revert ZeroValueNotAllowed();
        if (_deadline <= block.timestamp) revert DeadlineExpired();

        CampaignInfo memory campaign = IParentContract(parentContract)._getCampaignInfo(_campaignId);

        if (!campaign.isFundingComplete) revert FundingNotMet();
        if (campaign.uniswapPair == address(0)) revert InvalidParameters();

        address token = campaign.tokenAddress;
        
        // Check user has enough tokens
        if (IERC20(token).balanceOf(msg.sender) < _tokenAmount) revert NotEnoughTokens();

        // Transfer tokens from user to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), _tokenAmount);

        // Approve router to spend tokens
        IERC20(token).approve(address(uniswapRouter), _tokenAmount);

        // Set up swap path: token -> USDC (CORRECTED)
        address[] memory path = new address[](2);
        path[0] = address(token);  // FROM: campaign token
        path[1] = address(usdcToken);  // TO: USDC

        // Perform swap: sell exact tokens for minimum USDC
        uniswapRouter.swapExactTokensForTokens(
            _tokenAmount,    // exact amount of tokens to sell
            _minUsdcOut,     // minimum USDC to receive
            path,            // token -> USDC path
            msg.sender,      // send USDC directly to user
            _deadline        // deadline
        );
    }


    function swapUsdcForToken(
        uint32 _campaignId,
        uint256 _usdcAmount,
        uint256 _minTokenOut,
        uint256 _deadline
    ) external nonReentrant {
        uint256 campaignCount = IParentContract(parentContract).campaignCount();
        if (_campaignId == 0 || _campaignId > campaignCount) revert CampaignDoesNotExist();
        if (_usdcAmount == 0) revert ZeroValueNotAllowed();
        if (_deadline <= block.timestamp) revert DeadlineExpired();

        CampaignInfo memory campaign =  IParentContract(parentContract)._getCampaignInfo(_campaignId);

        if (!campaign.isFundingComplete) revert FundingNotMet();
        if (campaign.uniswapPair == address(0)) revert InvalidParameters();

        address token = campaign.tokenAddress;
        IERC20 usdc = usdcToken;

        // Check user has enough USDC
        if (usdc.balanceOf(msg.sender) < _usdcAmount) revert NotEnoughTokens();

        // Transfer USDC from user to this contract
        usdc.safeTransferFrom(msg.sender, address(this), _usdcAmount);

        // Approve router to spend USDC
        usdc.approve(address(uniswapRouter), _usdcAmount);

        // Set up swap path: USDC -> token
        address[] memory path = new address[](2);
        path[0] = address(usdc);
        path[1] = address(token);

        // Perform swap: sell exact USDC for minimum token
        uniswapRouter.swapExactTokensForTokens(
            _usdcAmount,
            _minTokenOut,
            path,
            msg.sender,
            _deadline
        );
    }

    /**
     * @dev Add liquidity to existing pool (for users after campaign completion)
     * @param _campaignId ID of the campaign
     * @param _tokenAmount Amount of tokens to add
     * @param _usdcAmount Amount of USDC to add
     * @param _minTokenLiquidity Minimum tokens for liquidity
     * @param _minUsdcLiquidity Minimum USDC for liquidity
     * @param _deadline Transaction deadline
     */
    function addLiquidityToPool(
        uint32 _campaignId,
        uint256 _tokenAmount,
        uint256 _usdcAmount,
        uint256 _minTokenLiquidity,
        uint256 _minUsdcLiquidity,
        uint256 _deadline
    ) external nonReentrant {
        uint256 campaignCount = IParentContract(parentContract).campaignCount();
        if (_campaignId == 0 || _campaignId > campaignCount) revert CampaignDoesNotExist();
        if (_tokenAmount == 0 || _usdcAmount == 0) revert ZeroValueNotAllowed();
        if (_deadline <= block.timestamp) revert DeadlineExpired();

        CampaignInfo memory campaign =  IParentContract(parentContract)._getCampaignInfo(_campaignId);

        if (!campaign.isFundingComplete) revert FundingNotMet();
        if (campaign.uniswapPair == address(0)) revert InvalidParameters();

        address token = campaign.tokenAddress;

        // Check balances
        if (IERC20(token).balanceOf(msg.sender) < _tokenAmount) revert NotEnoughTokens();
        if (usdcToken.balanceOf(msg.sender) < _usdcAmount) revert InsufficientFunds();

        // Check allowances
        if (IERC20(token).allowance(msg.sender, address(this)) < _tokenAmount) revert InsufficientFunds();
        if (usdcToken.allowance(msg.sender, address(this)) < _usdcAmount) revert InsufficientFunds();

        // Transfer tokens from user
        IERC20(token).safeTransferFrom(msg.sender, address(this), _tokenAmount);
        usdcToken.safeTransferFrom(msg.sender, address(this), _usdcAmount);

        // Approve router
        require(IERC20(token).approve(address(uniswapRouter), _tokenAmount), "Token approve failed");
        require(usdcToken.approve(address(uniswapRouter), _usdcAmount), "USDC approve failed");

        // Add liquidity
        try uniswapRouter.addLiquidity(
            address(token),
            address(usdcToken),
            _tokenAmount,
            _usdcAmount,
            _minTokenLiquidity,
            _minUsdcLiquidity,
            msg.sender, // LP tokens go to user
            _deadline
        ) {
            // Success - liquidity added
        } catch {
            // If failed, return tokens to user
            IERC20(token).safeTransfer(msg.sender, _tokenAmount);
            usdcToken.safeTransfer(msg.sender, _usdcAmount);
            revert("Failed to add liquidity");
        }
    }



    function getUserParticipatedCampaignsWithInvestmentCheck(
        address _user
    ) external view returns (CampaignInfo[] memory) {
        uint32 totalCampaigns = IParentContract(parentContract).campaignCount();
        IParentContract extendedParent = IParentContract(address(parentContract));
        
        // First pass: count participated campaigns
        uint32 participatedCount = 0;
        for (uint32 i = 1; i <= totalCampaigns; i++) {
            try extendedParent.getUserInvestment(i, _user) returns (uint128 investment) {
                if (investment > 0) {
                    participatedCount++;
                }
            } catch {
                // Skip if function doesn't exist or reverts
                continue;
            }
        }

        // Second pass: populate array
        CampaignInfo[] memory participatedCampaigns = new CampaignInfo[](participatedCount);
        uint32 index = 0;
        
        for (uint32 i = 1; i <= totalCampaigns; i++) {
            try extendedParent.getUserInvestment(i, _user) returns (uint128 investment) {
                if (investment > 0) {
                    participatedCampaigns[index] = IParentContract(parentContract)._getCampaignInfo(i);
                    index++;
                }
            } catch {
                continue;
            }
        }

        return participatedCampaigns;
    }


    /**
     * @dev Get campaigns created by a user by iterating through all campaigns
     * This is less gas efficient but works without modifying the parent contract
     */
    function getCampaignsByCreator(
        address _creator
    ) external view returns (CampaignInfo[] memory) {
        uint32 totalCampaigns = IParentContract(parentContract).campaignCount();
        
        // First pass: count campaigns by this creator
        uint32 creatorCampaignCount = 0;
        for (uint32 i = 1; i <= totalCampaigns; i++) {
            CampaignInfo memory campaign = IParentContract(parentContract)._getCampaignInfo(i);
            if (campaign.creator == _creator) {
                creatorCampaignCount++;
            }
        }

        // Second pass: populate the array
        CampaignInfo[] memory campaignsLocal = new CampaignInfo[](creatorCampaignCount);
        uint32 index = 0;
        
        for (uint32 i = 1; i <= totalCampaigns; i++) {
            CampaignInfo memory campaign = IParentContract(parentContract)._getCampaignInfo(i);
            if (campaign.creator == _creator) {
                campaignsLocal[index] = campaign;
                index++;
            }
        }

        return campaignsLocal;
    }


    /**
     * @dev Get summary statistics
     * @return totalCampaigns Total number of campaigns
     * @return activeCampaigns Number of active campaigns  
     * @return completedCampaigns Number of completed campaigns
     * @return cancelledCampaigns Number of cancelled campaigns
     * @return expiredCampaigns Number of expired campaigns
     * @return totalFundingRaised Total USDC raised across all campaigns
     */
    function getSummaryStats() external view returns (
        uint256 totalCampaigns,
        uint256 activeCampaigns,
        uint256 completedCampaigns, 
        uint256 cancelledCampaigns,
        uint256 expiredCampaigns,
        uint256 totalFundingRaised
    ) {
    
        uint256 campaignCount = IParentContract(parentContract).campaignCount();
        for (uint32 i = 1; i <= campaignCount; i++) {
            CampaignInfo memory campaign = IParentContract(parentContract)._getCampaignInfo(i);
            totalFundingRaised += campaign.amountRaised;
            
            if (campaign.isCancelled) {
                cancelledCampaigns++;
            } else if (campaign.isFundingComplete) {
                completedCampaigns++;
            } else if (block.timestamp > campaign.deadline) {
                expiredCampaigns++;
            } else {
                activeCampaigns++;
            }

            totalCampaigns++;
        }
        
        return (
            totalCampaigns,
            activeCampaigns,
            completedCampaigns,
            cancelledCampaigns,
            expiredCampaigns,
            totalFundingRaised
        );
    }

    /**
     * @dev Preview tokens received for USDC amount
     */
    function previewPurchase(
        uint32 _campaignId,
        uint256 _usdcAmount
    ) external view returns (uint256 tokensReceived) {

        uint256 campaignCount = IParentContract(parentContract).campaignCount();

        if (_campaignId == 0 || _campaignId > campaignCount) revert Launchpad.InvalidInput();
        CampaignInfo memory campaign = IParentContract(parentContract)._getCampaignInfo(_campaignId);

        if (
            !campaign.isActive ||
            campaign.isFundingComplete ||
            campaign.isCancelled
        ) {
            return 0;
        }

        return
            LaunchPadCore._calculatePurchaseReturn(
                campaign.tokensForSale,
                campaign.amountRaised,
                campaign.reserveRatio,
                _usdcAmount
            );
    }


      /**
     * @dev Get all campaigns with pagination
     * @param _offset Starting index for pagination (0-based)
     * @param _limit Number of campaigns to return (max 50)
     * @return campaignsLocal Array of campaign info
     * @return total Total number of campaigns
     * @return hasMore Whether there are more campaigns after this page
     */
    function getAllCampaignsPaginated(
        uint32 _offset,
        uint32 _limit
    )
        external
        view
        returns (
            CampaignInfo[] memory campaignsLocal,
            uint32 total,
            bool hasMore
        )
    {
        if (_limit == 0 || _limit > 50) revert InvalidInput();

        uint32 campaignCount = parentContract.campaignCount();
        total = campaignCount;

        if (_offset >= campaignCount) {
            return (new CampaignInfo[](0), total, false);
        }

        uint32 remaining = campaignCount - _offset;
        uint32 actualLimit = remaining > _limit ? _limit : remaining;

        campaignsLocal = new CampaignInfo[](actualLimit);

        for (uint32 i = 0; i < actualLimit; i++) {
            uint32 campaignId = _offset + i + 1; // Campaign IDs start at 1
            campaignsLocal[i] = parentContract._getCampaignInfo(campaignId);
        }

        hasMore = _offset + actualLimit < campaignCount;

        return (campaignsLocal, total, hasMore);
    }    


    /**
     * @dev Get expected swap output for debugging
     * @param _campaignId ID of the campaign
     * @param _tokenAmountIn Amount of tokens to swap
     * @return expectedUsdcOut Expected USDC output
     */
    function getSwapAmountOut(
        uint32 _campaignId, 
        uint256 _tokenAmountIn
    ) external view returns (uint256 expectedUsdcOut) {
        CampaignInfo memory campaign = IParentContract(parentContract)._getCampaignInfo(_campaignId);

        
        if (campaign.uniswapPair == address(0) || _tokenAmountIn == 0) {
            return 0;
        }

        // Set up path
        address[] memory path = new address[](2);
        path[0] = campaign.tokenAddress;
        path[1] = address(usdcToken);

        try uniswapRouter.getAmountsOut(_tokenAmountIn, path) returns (uint[] memory amounts) {
            return amounts[1]; // USDC amount out
        } catch {
            return 0;
        }
    }

    /**
     * @dev Get expected token output when swapping USDC
     * @param _campaignId ID of the campaign
     * @param _usdcAmountIn Amount of USDC to swap
     * @return expectedTokenOut Expected token output
     */
    function getTokenAmountOut(
        uint32 _campaignId, 
        uint256 _usdcAmountIn
    ) external view returns (uint256 expectedTokenOut) {
        CampaignInfo memory campaign = IParentContract(parentContract)._getCampaignInfo(_campaignId);
        
        if (campaign.uniswapPair == address(0) || _usdcAmountIn == 0) {
            return 0;
        }

        // Set up path: USDC → Token
        address[] memory path = new address[](2);
        path[0] = address(usdcToken);
        path[1] = campaign.tokenAddress;

        try uniswapRouter.getAmountsOut(_usdcAmountIn, path) returns (uint[] memory amounts) {
            return amounts[1]; // Token amount out
        } catch {
            return 0;
        }
    }


    /**
     * @dev Get user's total investment across all campaigns
     * @param _user The user's address
     * @return totalInvestment Total USDC amount invested by the user
     * @return campaignsParticipated Number of campaigns the user participated in
     */
    function getUserTotalInvestment(address _user) 
        external 
        view 
        returns (uint256 totalInvestment, uint32 campaignsParticipated) 
    {
        if (_user == address(0)) revert AddressZeroDetected();
        
        uint32 totalCampaigns = IParentContract(parentContract).campaignCount();
        IParentContract extendedParent = IParentContract(address(parentContract));
        
        for (uint32 i = 1; i <= totalCampaigns; i++) {
            try extendedParent.getUserInvestment(i, _user) returns (uint128 investment) {
                if (investment > 0) {
                    totalInvestment += investment;
                    campaignsParticipated++;
                }
            } catch {
                // Skip if function doesn't exist or reverts
                continue;
            }
        }
        
        return (totalInvestment, campaignsParticipated);
    }

}
