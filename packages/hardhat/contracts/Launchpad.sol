//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

import "./library/Math.sol";
import "./library/LaunchpadCore.sol";
import "./interfaces/IUniswapV2Router.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./Token.sol";

/**
 * @title Enhanced Fundraising Launchpad
 * @dev A fundraising platform implementing the Bancor bonding curve with dynamic token allocations
 */

contract Launchpad is Initializable, ReentrancyGuardUpgradeable {
    using Math for uint256;
    using SafeERC20 for IERC20;

    // Packed custom errors
    error InvalidInput();
    error Unauthorized();
    error InactiveCampaign();
    error InsufficientBalance();

    // Packed events
    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string name, uint256 targetFunding, uint256 totalSupply, uint256 deadline);
    event TokensPurchased(uint256 indexed campaignId, address indexed buyer, uint256 usdcAmount, uint256 tokensReceived, uint256 timestamp);
    event FundingCompleted(uint256 indexed campaignId, uint256 totalFunding);
    event LiquidityAdded(uint256 indexed campaignId, uint256 usdcAmount, uint256 tokensAmount);
    event CampaignCancelled(uint256 indexed campaignId, address indexed creator);
    event RefundClaimed(uint256 indexed campaignId, address indexed investor, uint256 amount);
    event PlatformFeeUpdated(uint256 newFee);
    event UserParticipatedInCampaign(uint256 indexed campaignId, address indexed user, uint256 amount);
    event CampaignPromoted(uint256 indexed campaignId);
    event OgPointsAwarded(uint256 indexed campaignId, address indexed user, uint256 amount);

    // Packed struct - optimized for storage
    struct Campaign {
        address creator;           // 20 bytes
        IERC20 token;             // 20 bytes
        address uniswapPair;      // 20 bytes
        uint128 targetAmount;     // 16 bytes - reduced from uint256
        uint128 amountRaised;     // 16 bytes - reduced from uint256
        uint64 deadline;          // 8 bytes - reduced from uint256 (sufficient until year 2554)
        uint32 reserveRatio;      // 4 bytes
        uint32 blockNumberCreated; // 4 bytes - reduced from uint256
        bool isActive;            // 1 byte
        bool isFundingComplete;   // 1 byte
        bool isCancelled;         // 1 byte
        bool isPromoted;          // 1 byte
        // Total: 112 bytes per slot optimization
        
        // Second storage slot
        uint128 tokensSold;       // 16 bytes
        uint128 totalSupply;      // 16 bytes
        uint128 tokensForSale;    // 16 bytes
        uint128 creatorAllocation; // 16 bytes
        
        // Third storage slot
        uint128 liquidityAllocation; // 16 bytes
        uint128 platformFeeTokens;   // 16 bytes
        uint128 promotionalOgPoints; // 16 bytes
        uint32 id;                   // 4 bytes
        
        string name;
        string symbol;
        string description;
        mapping(address => uint128) investments; // reduced from uint256
    }

    struct CampaignInfo {
        uint32 id;
        address creator;
        uint128 targetAmount;
        uint128 amountRaised;
        uint128 tokensSold;
        uint128 totalSupply;
        uint128 tokensForSale;
        uint128 creatorAllocation;
        uint128 liquidityAllocation;
        uint128 platformFeeTokens;
        uint64 deadline;
        address tokenAddress;
        bool isActive;
        bool isFundingComplete;
        bool isCancelled;
        string name;
        string symbol;
        string description;
        uint32 reserveRatio;
        uint32 blockNumberCreated;
        uint128 promotionalOgPoints;
        bool isPromoted;
        address uniswapPair;
    }

    // Packed constants
    uint16 public constant TOKENS_FOR_SALE_PCT = 5000;
    uint16 public constant CREATOR_ALLOCATION_PCT = 2000;
    uint16 public constant LIQUIDITY_ALLOCATION_PCT = 2500;
    uint16 public constant BASIS_POINTS = 10000;
    uint16 public constant OG_POINTS_ALLOCATION = 1000;
    uint32 public constant MAX_RESERVE_RATIO = 1000000;
    uint128 public constant MIN_TOTAL_SUPPLY = 1_000_000 * 10 ** 18;
    uint128 public constant MAX_TOTAL_SUPPLY = 1_000_000_000_000 * 10 ** 18;
    uint64 public constant MIN_DEADLINE = 1 days;
    uint64 public constant MAX_DEADLINE = 365 days;

    uint32 public campaignCount;
    uint128 public totalPlatformFees;
    uint128 public promotionFee;
    uint16 public platformFeePercentage;

    IERC20 public usdcToken;
    IUniswapV2Router public uniswapRouter;
    IUniswapV2Factory public uniswapFactory;

    mapping(uint256 => Campaign) public campaigns;
    mapping(address => uint32[]) public creatorCampaigns;
    mapping(address => uint32[]) public userParticipatedCampaigns;
    mapping(address => mapping(uint256 => bool)) public userParticipation;
    mapping(address => uint128) public ogPoints;

    modifier campaignExists(uint256 _campaignId) {
        if (_campaignId == 0 || _campaignId > campaignCount) revert InvalidInput();
        _;
    }

    function initialize(address _contractOwner, address _usdcToken, address _uniswapRouter, address _uniswapFactory, uint128 _promotionFee) public initializer {
        __ReentrancyGuard_init();
        if (_usdcToken == address(0) || _uniswapRouter == address(0) || _uniswapFactory == address(0) || _contractOwner == address(0)) revert InvalidInput();

        usdcToken = IERC20(_usdcToken);
        uniswapRouter = IUniswapV2Router(_uniswapRouter);
        uniswapFactory = IUniswapV2Factory(_uniswapFactory);
        platformFeePercentage = 200;
        promotionFee = _promotionFee;
    }

    function createCampaign(
        string memory _name,
        string memory _symbol,
        string memory _description,
        uint128 _targetFunding,
        uint128 _totalSupply,
        uint32 _reserveRatio,
        uint64 _deadline
    ) external returns (uint32 campaignId) {
        if (msg.sender == address(0) || _targetFunding == 0) revert InvalidInput();
        if (_totalSupply < MIN_TOTAL_SUPPLY || _totalSupply > MAX_TOTAL_SUPPLY) revert InvalidInput();
        if (_reserveRatio < 100000 || _reserveRatio > 900000) revert InvalidInput();
        if (_deadline <= uint64(block.timestamp) + MIN_DEADLINE || _deadline > uint64(block.timestamp) + MAX_DEADLINE) revert InvalidInput();

        uint128 tokensForSale = _totalSupply * TOKENS_FOR_SALE_PCT / BASIS_POINTS;
        uint128 creatorAllocation = _totalSupply * CREATOR_ALLOCATION_PCT / BASIS_POINTS;
        uint128 liquidityAllocation = _totalSupply * LIQUIDITY_ALLOCATION_PCT / BASIS_POINTS;
        uint128 platformFeeTokens = _totalSupply * platformFeePercentage / BASIS_POINTS;

        require(tokensForSale + creatorAllocation + liquidityAllocation + platformFeeTokens <= _totalSupply, "Allocations exceed total supply");

        TokenFacet campaignToken = new TokenFacet(_name, _symbol, address(this));

        campaignId = ++campaignCount;
        Campaign storage c = campaigns[campaignId];

        c.id = campaignId;
        c.creator = msg.sender;
        c.targetAmount = _targetFunding;
        c.totalSupply = _totalSupply;
        c.tokensForSale = tokensForSale;
        c.creatorAllocation = creatorAllocation;
        c.liquidityAllocation = liquidityAllocation;
        c.platformFeeTokens = platformFeeTokens;
        c.deadline = _deadline;
        c.token = campaignToken;
        c.isActive = true;
        c.name = _name;
        c.symbol = _symbol;
        c.description = _description;
        c.reserveRatio = _reserveRatio;
        c.blockNumberCreated = uint32(block.number);

        creatorCampaigns[msg.sender].push(campaignId);

        emit CampaignCreated(campaignId, msg.sender, _name, _targetFunding, _totalSupply, _deadline);
    }

    function promoteCampaign(uint32 _campaignId) external {
        Campaign storage c = campaigns[_campaignId];
        if (_campaignId == 0 || _campaignId > campaignCount) revert InvalidInput();
        if (msg.sender != c.creator) revert Unauthorized();
        if (!c.isActive || c.isCancelled || c.isFundingComplete) revert InactiveCampaign();
        if (uint64(block.timestamp) > c.deadline) revert InvalidInput();
        if (usdcToken.balanceOf(msg.sender) < promotionFee) revert InsufficientBalance();

        c.isPromoted = true;
        c.promotionalOgPoints = OG_POINTS_ALLOCATION;
        totalPlatformFees += c.platformFeeTokens;
        usdcToken.safeTransferFrom(msg.sender, address(this), promotionFee);
        emit CampaignPromoted(_campaignId);
    }

    function buyTokens(uint32 _campaignId, uint128 _usdcAmount) external nonReentrant campaignExists(_campaignId) {
        if (_usdcAmount == 0) revert InvalidInput();
        Campaign storage c = campaigns[_campaignId];

        if (!c.isActive || c.isCancelled || c.isFundingComplete) revert InactiveCampaign();
        if (uint64(block.timestamp) > c.deadline) revert InvalidInput();
        if (usdcToken.balanceOf(msg.sender) < _usdcAmount) revert InsufficientBalance();

        uint256 tokensToMint = LaunchPadCore._calculatePurchaseReturn(
            c.tokensForSale,
            c.amountRaised,
            c.reserveRatio,
            _usdcAmount
        );

        if (c.tokensSold + uint128(tokensToMint) > c.tokensForSale) {
            uint128 remainingTokens = c.tokensForSale - c.tokensSold;
            uint256 usdcNeeded = LaunchPadCore._calculateExactUsdcForTokens(c, remainingTokens);
            tokensToMint = remainingTokens;
            _usdcAmount = uint128(usdcNeeded);
        }

        if (!userParticipation[msg.sender][_campaignId]) {
            userParticipation[msg.sender][_campaignId] = true;
            userParticipatedCampaigns[msg.sender].push(_campaignId);
            emit UserParticipatedInCampaign(_campaignId, msg.sender, _usdcAmount);
        }

        usdcToken.safeTransferFrom(msg.sender, address(this), _usdcAmount);

        c.amountRaised += _usdcAmount;
        c.tokensSold += uint128(tokensToMint);
        c.investments[msg.sender] += _usdcAmount;

        if (c.isPromoted && c.promotionalOgPoints > 0) {
            uint256 percentage = (uint256(tokensToMint) * 1e18) / c.tokensForSale;
            uint128 awardedOgPoints = uint128((percentage * c.promotionalOgPoints) / 1e18);
            if (awardedOgPoints > c.promotionalOgPoints) {
                awardedOgPoints = c.promotionalOgPoints;
            }
            ogPoints[msg.sender] += awardedOgPoints;
            c.promotionalOgPoints -= awardedOgPoints;
            emit OgPointsAwarded(_campaignId, msg.sender, awardedOgPoints);
        }

        TokenFacet(address(c.token)).mint(msg.sender, tokensToMint);

        emit TokensPurchased(_campaignId, msg.sender, _usdcAmount, uint256(tokensToMint), block.timestamp);

        if (c.tokensSold >= c.tokensForSale || c.amountRaised >= c.targetAmount) {
            _completeFunding(_campaignId);
        }
    }
    
    function cancelCampaign(uint32 _campaignId) external campaignExists(_campaignId) {
        Campaign storage c = campaigns[_campaignId];

        if (msg.sender != c.creator) revert Unauthorized();
        // if (!c.isActive || c.tokensSold > 0) revert InvalidInput();

        c.isActive = false;
        c.isCancelled = true;

        emit CampaignCancelled(_campaignId, c.creator);
    }

    function claimRefund(uint32 _campaignId) external nonReentrant {
        Campaign storage c = campaigns[_campaignId];

        bool refundable = c.isCancelled || (uint64(block.timestamp) > c.deadline && !c.isFundingComplete);
        if (!refundable) revert InvalidInput();

        uint128 investment = c.investments[msg.sender];
        c.investments[msg.sender] = 0;

        uint256 tokenBalance = IERC20(address(c.token)).balanceOf(msg.sender);
        if (tokenBalance > 0) {
            TokenFacet(address(c.token)).burnFrom(msg.sender, tokenBalance);
        }

        usdcToken.safeTransfer(msg.sender, investment);
        emit RefundClaimed(_campaignId, msg.sender, investment);
    }

    function getUserInvestment(uint32 _campaignId, address _user) campaignExists(_campaignId) external view returns (uint128) {
        return campaigns[_campaignId].investments[_user];
    }

    function _completeFunding(uint32 _campaignId) internal {
        Campaign storage c = campaigns[_campaignId];

        c.isActive = false;
        c.isFundingComplete = true;

        uint128 creatorFunding = c.amountRaised / 2;
        uint128 liquidityFunding = c.amountRaised - creatorFunding;

        TokenFacet(address(c.token)).mint(c.creator, c.creatorAllocation);
        TokenFacet(address(c.token)).mint(address(this), c.platformFeeTokens);

        usdcToken.safeTransfer(c.creator, creatorFunding);

        totalPlatformFees += (liquidityFunding * platformFeePercentage) / BASIS_POINTS;

        _addLiquidity(_campaignId, liquidityFunding);

        emit FundingCompleted(_campaignId, c.amountRaised);
    }

    function _addLiquidity(uint32 _campaignId, uint128 usdcAmount) internal {
        Campaign storage c = campaigns[_campaignId];

        TokenFacet(address(c.token)).mint(address(this), c.liquidityAllocation);

        require(IERC20(usdcToken).approve(address(uniswapRouter), usdcAmount), "approve failed.");
        require(IERC20(address(c.token)).approve(address(uniswapRouter), c.liquidityAllocation), "approve failed.");

        address pair = IUniswapV2Factory(address(uniswapFactory)).getPair(address(usdcToken), address(c.token));

        if (pair == address(0)) {
            pair = IUniswapV2Factory(uniswapFactory).createPair(address(usdcToken), address(c.token));
        }

        c.uniswapPair = pair;

        try uniswapRouter.addLiquidity(
            address(usdcToken),
            address(c.token),
            usdcAmount,
            c.liquidityAllocation,
            (usdcAmount * 95) / 100,
            (c.liquidityAllocation * 95) / 100,
            c.creator,
            block.timestamp + 300
        ) {
            emit LiquidityAdded(_campaignId, usdcAmount, c.liquidityAllocation);
        } catch {
            usdcToken.safeTransfer(c.creator, usdcAmount);
            IERC20(address(c.token)).safeTransfer(c.creator, c.liquidityAllocation);
        }
    }

    function _getCampaignInfo(uint32 _campaignId) public view returns (CampaignInfo memory) {
        Campaign storage c = campaigns[_campaignId];
        
        return CampaignInfo({
            id: c.id,
            creator: c.creator,
            targetAmount: c.targetAmount,
            amountRaised: c.amountRaised,
            tokensSold: c.tokensSold,
            totalSupply: c.totalSupply,
            tokensForSale: c.tokensForSale,
            creatorAllocation: c.creatorAllocation,
            liquidityAllocation: c.liquidityAllocation,
            platformFeeTokens: c.platformFeeTokens,
            deadline: c.deadline,
            tokenAddress: address(c.token),
            isActive: c.isActive,
            isFundingComplete: c.isFundingComplete,
            isCancelled: c.isCancelled,
            name: c.name,
            symbol: c.symbol,
            description: c.description,
            reserveRatio: c.reserveRatio,
            uniswapPair: c.uniswapPair,
            blockNumberCreated: c.blockNumberCreated,
            promotionalOgPoints: c.promotionalOgPoints,
            isPromoted: c.isPromoted
        });
    }

    receive() external payable {}
}