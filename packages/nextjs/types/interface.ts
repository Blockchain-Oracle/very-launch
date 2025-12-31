export interface ICampaign {
  id: number;
  creator: string;
  targetAmount: number;
  amountRaised: number;
  tokensSold: number;
  totalSupply: number;
  tokensForSale: number;
  creatorAllocation: number;
  liquidityAllocation: number;
  platformFeeTokens: number;
  deadline: number;
  tokenAddress: string;
  isActive: boolean;
  isFundingComplete: boolean;
  isCancelled: boolean;
  name: string;
  symbol: string;
  description: string;
  uniswapPair: string;
  promotionalOgPoints?: number;
  isPromoted?: boolean;
  blockNumberCreated: number;
  reserveRatio: number;
}

export interface IStakingPool {
  stakingToken: string; // Token to be staked
  totalStaked: number; // Total amount staked in this pool
  rewardPool: number; // Available rewards for distribution
  apy: number; // Annual percentage yield (in basis points, e.g., 1000 = 10%)
  minStakingPeriod: number; // Minimum staking period in seconds
  enabled: boolean; // Whether staking is enabled for this pool
  emergencyMode: boolean; // Emergency mode for immediate withdrawals
  stakerCount: number;
}

export interface ITokenPurchaseEvents {
  buyer: string;
  campaignId: number;
  timestamp: number;
  tokensReceived: number;
  usdcAmount: number;
}

export interface IVeryLaunchFeature {
  id: number;
  title: string;
  description: string;
}
