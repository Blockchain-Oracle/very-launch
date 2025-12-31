//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title TokenStaking Contract
 * @dev Allows users to stake tokens from completed launchpad campaigns and earn rewards
 */

interface ILaunchpad {
    function campaigns(
        uint256 campaignId
    )
        external
        view
        returns (
            address creator,
            address token,
            address uniswapPair,
            uint128 targetAmount,
            uint128 amountRaised,
            uint64 deadline,
            uint32 reserveRatio,
            uint32 blockNumberCreated,
            bool isActive,
            bool isFundingComplete,
            bool isCancelled,
            bool isPromoted
        );

    function campaignCount() external view returns (uint32);
}

contract TokenStaking is Initializable, ReentrancyGuardUpgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    // Custom errors
    error InvalidInput();
    error Unauthorized();
    error CampaignNotCompleted();
    error StakingNotEnabled();
    error InsufficientBalance();
    error NoRewardsAvailable();
    error StakingPeriodNotEnded();

    // Events
    event StakingPoolCreated(uint32 indexed campaignId, address indexed token, uint256 apy, uint256 minStakingPeriod);
    event TokensStaked(uint32 indexed campaignId, address indexed user, uint256 amount, uint256 timestamp);
    event TokensUnstaked(
        uint32 indexed campaignId,
        address indexed user,
        uint256 amount,
        uint256 rewards,
        uint256 timestamp
    );
    event RewardsClaimed(uint32 indexed campaignId, address indexed user, uint256 rewards, uint256 timestamp);
    event StakingPoolUpdated(uint32 indexed campaignId, uint256 newApy, bool enabled);
    event RewardsAdded(uint32 indexed campaignId, uint256 amount);
    event EmergencyWithdraw(uint32 indexed campaignId, address indexed user, uint256 amount);

    // Staking pool structure
    struct StakingPool {
        IERC20 stakingToken; // Token to be staked
        uint128 totalStaked; // Total amount staked in this pool
        uint128 rewardPool; // Available rewards for distribution
        uint64 apy; // Annual percentage yield (in basis points, e.g., 1000 = 10%)
        uint64 minStakingPeriod; // Minimum staking period in seconds
        uint32 campaignId; // Associated campaign ID
        bool enabled; // Whether staking is enabled for this pool
        bool emergencyMode; // Emergency mode for immediate withdrawals
    }

    // User stake information
    struct UserStake {
        uint128 amount; // Amount staked by user
        uint128 rewards; // Accumulated rewards
        uint64 stakingTime; // When user started staking
        uint64 lastRewardUpdate; // Last time rewards were calculated
    }

    // Constants
    uint64 public constant MAX_APY = 10000; // 100% APY max
    uint64 public constant MIN_STAKING_PERIOD = 1 days;
    uint64 public constant MAX_STAKING_PERIOD = 365 days;
    uint16 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

    // State variables
    ILaunchpad public launchpad;
    uint32 public stakingPoolCount;

    // Mappings
    mapping(uint32 => StakingPool) public stakingPools; // campaignId => StakingPool
    mapping(uint32 => mapping(address => UserStake)) public userStakes; // campaignId => user => UserStake
    mapping(address => uint32[]) public userStakingPools; // user => campaignIds they've staked in
    mapping(uint32 => address[]) public poolStakers; // campaignId => list of stakers
    mapping(uint32 => mapping(address => bool)) public hasStaked; // campaignId => user => hasStaked

    modifier validCampaign(uint32 _campaignId) {
        if (_campaignId == 0 || _campaignId > launchpad.campaignCount()) revert InvalidInput();
        _;
    }

    modifier campaignCompleted(uint32 _campaignId) {
        (, , , , , , , , , bool isFundingComplete, bool isCancelled, ) = launchpad.campaigns(_campaignId);
        if (!isFundingComplete || isCancelled) revert CampaignNotCompleted();
        _;
    }

    modifier stakingEnabled(uint32 _campaignId) {
        if (!stakingPools[_campaignId].enabled) revert StakingNotEnabled();
        _;
    }

    function initialize(address _launchpad, address _owner) public initializer {
        if (_launchpad == address(0) || _owner == address(0)) revert InvalidInput();

        __ReentrancyGuard_init();
        __Ownable_init(_owner);

        launchpad = ILaunchpad(_launchpad);
    }

    /**
     * @notice Creates a staking pool for a completed campaign
     * @param _campaignId The campaign ID
     * @param _apy Annual percentage yield in basis points (e.g., 1000 = 10%)
     * @param _minStakingPeriod Minimum staking period in seconds
     */
    function createStakingPool(
        uint32 _campaignId,
        uint64 _apy,
        uint64 _minStakingPeriod
    ) external onlyOwner validCampaign(_campaignId) campaignCompleted(_campaignId) {
        if (_apy == 0 || _apy > MAX_APY) revert InvalidInput();
        if (_minStakingPeriod < MIN_STAKING_PERIOD || _minStakingPeriod > MAX_STAKING_PERIOD) revert InvalidInput();
        if (address(stakingPools[_campaignId].stakingToken) != address(0)) revert InvalidInput(); // Pool already exists

        // Get token address from launchpad
        (, address tokenAddress, , , , , , , , , , ) = launchpad.campaigns(_campaignId);

        StakingPool storage pool = stakingPools[_campaignId];
        pool.stakingToken = IERC20(tokenAddress);
        pool.apy = _apy;
        pool.minStakingPeriod = _minStakingPeriod;
        pool.campaignId = _campaignId;
        pool.enabled = true;

        stakingPoolCount++;

        emit StakingPoolCreated(_campaignId, tokenAddress, _apy, _minStakingPeriod);
    }

    /**
     * @notice Stake tokens in a specific campaign's pool
     * @param _campaignId The campaign ID
     * @param _amount Amount of tokens to stake
     */
    function stakeTokens(
        uint32 _campaignId,
        uint128 _amount
    ) external nonReentrant validCampaign(_campaignId) stakingEnabled(_campaignId) {
        if (_amount == 0) revert InvalidInput();

        StakingPool storage pool = stakingPools[_campaignId];
        UserStake storage userStake = userStakes[_campaignId][msg.sender];

        // Check user balance
        if (pool.stakingToken.balanceOf(msg.sender) < _amount) revert InsufficientBalance();

        // Update rewards before changing stake amount
        _updateUserRewards(_campaignId, msg.sender);

        // Transfer tokens to contract
        pool.stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Update user stake
        if (userStake.amount == 0) {
            userStake.stakingTime = uint64(block.timestamp);
            userStake.lastRewardUpdate = uint64(block.timestamp);

            // Add user to staking pools if first time
            if (!hasStaked[_campaignId][msg.sender]) {
                hasStaked[_campaignId][msg.sender] = true;
                userStakingPools[msg.sender].push(_campaignId);
                poolStakers[_campaignId].push(msg.sender);
            }
        }

        userStake.amount += _amount;
        pool.totalStaked += _amount;

        emit TokensStaked(_campaignId, msg.sender, _amount, block.timestamp);
    }

    /**
     * @notice Unstake tokens and claim rewards
     * @param _campaignId The campaign ID
     * @param _amount Amount of tokens to unstake (0 = unstake all)
     */
    function unstakeTokens(uint32 _campaignId, uint128 _amount) external nonReentrant validCampaign(_campaignId) {
        StakingPool storage pool = stakingPools[_campaignId];
        UserStake storage userStake = userStakes[_campaignId][msg.sender];

        if (userStake.amount == 0) revert InsufficientBalance();

        // Check minimum staking period (unless emergency mode)
        if (!pool.emergencyMode && block.timestamp < userStake.stakingTime + pool.minStakingPeriod) {
            revert StakingPeriodNotEnded();
        }

        // If amount is 0, unstake everything
        if (_amount == 0 || _amount > userStake.amount) {
            _amount = userStake.amount;
        }

        // Update rewards before unstaking
        _updateUserRewards(_campaignId, msg.sender);

        // Calculate and transfer rewards
        uint128 rewards = userStake.rewards;
        if (rewards > 0 && rewards <= pool.rewardPool) {
            userStake.rewards = 0;
            pool.rewardPool -= rewards;
            pool.stakingToken.safeTransfer(msg.sender, rewards);
        } else if (rewards > pool.rewardPool) {
            // Transfer available rewards only
            userStake.rewards -= pool.rewardPool;
            rewards = pool.rewardPool;
            pool.rewardPool = 0;
            if (rewards > 0) {
                pool.stakingToken.safeTransfer(msg.sender, rewards);
            }
        }

        // Update stake amounts
        userStake.amount -= _amount;
        pool.totalStaked -= _amount;

        // Transfer staked tokens back to user
        pool.stakingToken.safeTransfer(msg.sender, _amount);

        emit TokensUnstaked(_campaignId, msg.sender, _amount, rewards, block.timestamp);
    }

    /**
     * @notice Claim accumulated rewards without unstaking
     * @param _campaignId The campaign ID
     */
    function claimRewards(uint32 _campaignId) external nonReentrant validCampaign(_campaignId) {
        StakingPool storage pool = stakingPools[_campaignId];
        UserStake storage userStake = userStakes[_campaignId][msg.sender];

        if (userStake.amount == 0) revert InsufficientBalance();

        // Update rewards
        _updateUserRewards(_campaignId, msg.sender);

        uint128 rewards = userStake.rewards;
        if (rewards == 0) revert NoRewardsAvailable();
        if (rewards > pool.rewardPool) {
            rewards = pool.rewardPool;
        }

        userStake.rewards -= rewards;
        pool.rewardPool -= rewards;

        pool.stakingToken.safeTransfer(msg.sender, rewards);

        emit RewardsClaimed(_campaignId, msg.sender, rewards, block.timestamp);
    }

    /**
     * @notice Add rewards to a staking pool
     * @param _campaignId The campaign ID
     * @param _amount Amount of tokens to add as rewards
     */
    function addRewards(uint32 _campaignId, uint128 _amount) external validCampaign(_campaignId) {
        if (_amount == 0) revert InvalidInput();

        StakingPool storage pool = stakingPools[_campaignId];

        pool.stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        pool.rewardPool += _amount;

        emit RewardsAdded(_campaignId, _amount);
    }

    /**
     * @notice Update staking pool parameters (owner only)
     * @param _campaignId The campaign ID
     * @param _apy New APY in basis points
     * @param _enabled Whether staking is enabled
     */
    function updateStakingPool(
        uint32 _campaignId,
        uint64 _apy,
        bool _enabled
    ) external onlyOwner validCampaign(_campaignId) {
        if (_apy > MAX_APY) revert InvalidInput();

        StakingPool storage pool = stakingPools[_campaignId];
        pool.apy = _apy;
        pool.enabled = _enabled;

        emit StakingPoolUpdated(_campaignId, _apy, _enabled);
    }

    /**
     * @notice Enable emergency mode for a pool (owner only)
     * @param _campaignId The campaign ID
     * @param _emergencyMode Whether to enable emergency mode
     */
    function setEmergencyMode(uint32 _campaignId, bool _emergencyMode) external onlyOwner validCampaign(_campaignId) {
        stakingPools[_campaignId].emergencyMode = _emergencyMode;
    }

    /**
     * @notice Emergency withdraw without rewards (in case of emergency mode)
     * @param _campaignId The campaign ID
     */
    function emergencyWithdraw(uint32 _campaignId) external nonReentrant validCampaign(_campaignId) {
        StakingPool storage pool = stakingPools[_campaignId];
        UserStake storage userStake = userStakes[_campaignId][msg.sender];

        if (!pool.emergencyMode) revert InvalidInput();
        if (userStake.amount == 0) revert InsufficientBalance();

        uint128 amount = userStake.amount;

        // Reset user stake
        userStake.amount = 0;
        userStake.rewards = 0;

        // Update pool total
        pool.totalStaked -= amount;

        // Transfer tokens back
        pool.stakingToken.safeTransfer(msg.sender, amount);

        emit EmergencyWithdraw(_campaignId, msg.sender, amount);
    }

    /**
     * @notice Internal function to update user rewards
     * @param _campaignId The campaign ID
     * @param _user User address
     */
    function _updateUserRewards(uint32 _campaignId, address _user) internal {
        StakingPool storage pool = stakingPools[_campaignId];
        UserStake storage userStake = userStakes[_campaignId][_user];

        if (userStake.amount == 0) return;

        uint256 timeStaked = block.timestamp - userStake.lastRewardUpdate;
        if (timeStaked == 0) return;

        // Calculate rewards: (amount * apy * timeStaked) / (BASIS_POINTS * SECONDS_PER_YEAR)
        uint256 rewardEarned = (uint256(userStake.amount) * pool.apy * timeStaked) / (BASIS_POINTS * SECONDS_PER_YEAR);

        userStake.rewards += uint128(rewardEarned);
        userStake.lastRewardUpdate = uint64(block.timestamp);
    }

    // View functions

    /**
     * @notice Get user's stake information for a campaign
     * @param _campaignId The campaign ID
     * @param _user User address
     * @return amount Amount staked
     * @return rewards Current rewards
     * @return stakingTime When user started staking
     * @return timeToUnlock Time until user can unstake
     */
    function getUserStakeInfo(
        uint32 _campaignId,
        address _user
    ) external view returns (uint128 amount, uint128 rewards, uint64 stakingTime, uint64 timeToUnlock) {
        UserStake memory userStake = userStakes[_campaignId][_user];
        StakingPool memory pool = stakingPools[_campaignId];

        amount = userStake.amount;
        stakingTime = userStake.stakingTime;

        // Calculate current rewards
        if (amount > 0) {
            uint256 timeStaked = block.timestamp - userStake.lastRewardUpdate;
            uint256 newRewards = (uint256(amount) * pool.apy * timeStaked) / (BASIS_POINTS * SECONDS_PER_YEAR);
            rewards = userStake.rewards + uint128(newRewards);
        }

        // Calculate time to unlock
        uint64 unlockTime = stakingTime + pool.minStakingPeriod;
        timeToUnlock = block.timestamp >= unlockTime ? 0 : unlockTime - uint64(block.timestamp);
    }

    /**
     * @notice Get staking pool information
     * @param _campaignId The campaign ID
     */
    function getStakingPoolInfo(
        uint32 _campaignId
    )
        external
        view
        returns (
            address stakingToken,
            uint128 totalStaked,
            uint128 rewardPool,
            uint64 apy,
            uint64 minStakingPeriod,
            bool enabled,
            bool emergencyMode,
            uint256 stakerCount
        )
    {
        StakingPool memory pool = stakingPools[_campaignId];

        return (
            address(pool.stakingToken),
            pool.totalStaked,
            pool.rewardPool,
            pool.apy,
            pool.minStakingPeriod,
            pool.enabled,
            pool.emergencyMode,
            poolStakers[_campaignId].length
        );
    }

    /**
     * @notice Get all campaigns a user has staked in
     * @param _user User address
     */
    function getUserStakingPools(address _user) external view returns (uint32[] memory) {
        return userStakingPools[_user];
    }

    /**
     * @notice Get all stakers in a pool
     * @param _campaignId The campaign ID
     */
    function getPoolStakers(uint32 _campaignId) external view returns (address[] memory) {
        return poolStakers[_campaignId];
    }

    /**
     * @notice Calculate potential rewards for a given amount and time
     * @param _campaignId The campaign ID
     * @param _amount Amount to stake
     * @param _duration Duration to stake for
     */
    function calculateRewards(uint32 _campaignId, uint128 _amount, uint64 _duration) external view returns (uint256) {
        StakingPool memory pool = stakingPools[_campaignId];
        return (uint256(_amount) * pool.apy * _duration) / (BASIS_POINTS * SECONDS_PER_YEAR);
    }
}
