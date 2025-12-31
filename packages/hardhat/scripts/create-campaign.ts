import { ethers } from "hardhat";
import { formatEther } from "ethers";

// Contract address for the deployed Launchpad contract (Proxy)
const LAUNCHPAD_CONTRACT_ADDRESS = "0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf";

// Contract ABI for the createCampaign function
const LAUNCHPAD_ABI = [
  "function createCampaign(string memory _name, string memory _symbol, string memory _description, uint128 _targetFunding, uint128 _totalSupply, uint32 _reserveRatio, uint64 _deadline) external returns (uint32 campaignId)",
  "function campaignCount() external view returns (uint32)",
  "function campaigns(uint256) external view returns (address creator, address token, address uniswapPair, uint128 targetAmount, uint128 amountRaised, uint64 deadline, uint32 reserveRatio, uint32 blockNumberCreated, bool isActive, bool isFundingComplete, bool isCancelled, bool isPromoted, uint128 tokensSold, uint128 totalSupply, uint128 tokensForSale, uint128 creatorAllocation, uint128 liquidityAllocation, uint128 platformFeeTokens, uint32 id, string memory name, string memory symbol, string memory description)",
  "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string name, uint256 targetFunding, uint256 totalSupply, uint256 deadline)",
];

// Campaign configuration
interface CampaignConfig {
  name: string;
  symbol: string;
  description: string;
  targetFunding: string; // in WVERY (with 6 decimals)
  totalSupply: string; // total token supply (with 18 decimals)
  reserveRatio: number; // between 100,000 and 900,000
  deadlineDays: number; // days from now (between 1 and 365)
}

// Default campaign configuration
const DEFAULT_CAMPAIGN: CampaignConfig = {
  name: "Space Bums Token",
  symbol: "SBT",
  description:
    "A revolutionary token for the Space Bums ecosystem, enabling decentralized fundraising and community governance.",
  targetFunding: "10000", // 10,000 WVERY
  totalSupply: "1000000000", // 1 billion tokens
  reserveRatio: 500000, // 50% reserve ratio
  deadlineDays: 30, // 30 days from now
};

async function main() {
  console.log("🚀 Creating a new campaign on Launchpad...\n");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Connect to the deployed Launchpad contract
  const launchpad = new ethers.Contract(LAUNCHPAD_CONTRACT_ADDRESS, LAUNCHPAD_ABI, deployer);

  // Get current campaign count
  const currentCampaignCount = await launchpad.campaignCount();
  console.log("Current campaign count:", currentCampaignCount.toString());

  // Prepare campaign parameters
  const campaignConfig = DEFAULT_CAMPAIGN;

  // Convert target funding to proper WVERY format (6 decimals)
  const targetFunding = ethers.parseUnits(campaignConfig.targetFunding, 6);

  // Convert total supply to proper token format (18 decimals)
  const totalSupply = ethers.parseUnits(campaignConfig.totalSupply, 18);

  // Calculate deadline (current timestamp + days)
  const currentTime = Math.floor(Date.now() / 1000);
  const deadline = currentTime + campaignConfig.deadlineDays * 24 * 60 * 60;

  console.log("Campaign Configuration:");
  console.log("  Name:", campaignConfig.name);
  console.log("  Symbol:", campaignConfig.symbol);
  console.log("  Description:", campaignConfig.description);
  console.log("  Target Funding:", campaignConfig.targetFunding, "WVERY");
  console.log("  Total Supply:", campaignConfig.totalSupply, "tokens");
  console.log("  Reserve Ratio:", campaignConfig.reserveRatio);
  console.log("  Deadline:", new Date(deadline * 1000).toLocaleString());
  console.log("  Deadline (timestamp):", deadline);
  console.log();

  // Validate parameters
  console.log("Validating parameters...");

  // Check total supply constraints (1M to 1T tokens)
  const minTotalSupply = ethers.parseUnits("1000000", 18); // 1M tokens
  const maxTotalSupply = ethers.parseUnits("1000000000000", 18); // 1T tokens

  if (totalSupply < minTotalSupply || totalSupply > maxTotalSupply) {
    throw new Error(`Total supply must be between 1M and 1T tokens`);
  }

  // Check reserve ratio constraints (100,000 to 900,000)
  if (campaignConfig.reserveRatio < 100000 || campaignConfig.reserveRatio > 900000) {
    throw new Error(`Reserve ratio must be between 100,000 and 900,000`);
  }

  // Check deadline constraints (1 day to 365 days from now)
  const minDeadline = currentTime + 1 * 24 * 60 * 60; // 1 day
  const maxDeadline = currentTime + 365 * 24 * 60 * 60; // 365 days

  if (deadline < minDeadline || deadline > maxDeadline) {
    throw new Error(`Deadline must be between 1 day and 365 days from now`);
  }

  console.log("✅ All parameters are valid!\n");

  try {
    // Estimate gas for the transaction
    console.log("Estimating gas...");
    const gasEstimate = await launchpad.createCampaign.estimateGas(
      campaignConfig.name,
      campaignConfig.symbol,
      campaignConfig.description,
      targetFunding,
      totalSupply,
      campaignConfig.reserveRatio,
      deadline,
    );
    console.log("Estimated gas:", gasEstimate.toString());

    // Create the campaign
    console.log("Creating campaign...");
    const tx = await launchpad.createCampaign(
      campaignConfig.name,
      campaignConfig.symbol,
      campaignConfig.description,
      targetFunding,
      totalSupply,
      campaignConfig.reserveRatio,
      deadline,
      {
        gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer
      },
    );

    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("Block number:", receipt?.blockNumber);
    console.log("Gas used:", receipt?.gasUsed.toString());

    // Parse the CampaignCreated event
    const campaignCreatedEvent = receipt?.logs.find((log: any) => {
      try {
        const parsed = launchpad.interface.parseLog(log);
        return parsed?.name === "CampaignCreated";
      } catch {
        return false;
      }
    });

    if (campaignCreatedEvent) {
      const parsedEvent = launchpad.interface.parseLog(campaignCreatedEvent);
      console.log("\n🎉 Campaign Created Successfully!");
      console.log("Campaign ID:", parsedEvent?.args.campaignId.toString());
      console.log("Creator:", parsedEvent?.args.creator);
      console.log("Name:", parsedEvent?.args.name);
      console.log("Target Funding:", ethers.formatUnits(parsedEvent?.args.targetFunding, 6), "WVERY");
      console.log("Total Supply:", ethers.formatUnits(parsedEvent?.args.totalSupply, 18), "tokens");
      console.log("Deadline:", new Date(Number(parsedEvent?.args.deadline) * 1000).toLocaleString());
    }

    // Get updated campaign count
    const newCampaignCount = await launchpad.campaignCount();
    console.log("\nNew campaign count:", newCampaignCount.toString());
  } catch (error) {
    console.error("❌ Error creating campaign:");
    if (error instanceof Error) {
      console.error("Message:", error.message);

      // Check for common error patterns
      if (error.message.includes("InvalidInput")) {
        console.error("💡 This might be due to invalid input parameters. Please check:");
        console.error("   - Total supply must be between 1M and 1T tokens");
        console.error("   - Reserve ratio must be between 100,000 and 900,000");
        console.error("   - Deadline must be between 1 day and 365 days from now");
        console.error("   - Target funding must be greater than 0");
      } else if (error.message.includes("insufficient funds")) {
        console.error("💡 Insufficient funds for gas. Please check your account balance.");
      } else if (error.message.includes("nonce")) {
        console.error("💡 Nonce error. Please try again in a moment.");
      }
    }
    throw error;
  }
}

// Helper function to create a campaign with custom parameters
export async function createCustomCampaign(config: Partial<CampaignConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CAMPAIGN, ...config };

  console.log("🚀 Creating custom campaign...\n");
  console.log("Custom Configuration:");
  console.log("  Name:", mergedConfig.name);
  console.log("  Symbol:", mergedConfig.symbol);
  console.log("  Description:", mergedConfig.description);
  console.log("  Target Funding:", mergedConfig.targetFunding, "WVERY");
  console.log("  Total Supply:", mergedConfig.totalSupply, "tokens");
  console.log("  Reserve Ratio:", mergedConfig.reserveRatio);
  console.log("  Deadline Days:", mergedConfig.deadlineDays);
  console.log();

  // Update the default campaign and run main
  Object.assign(DEFAULT_CAMPAIGN, mergedConfig);
  await main();
}

// Run the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { main as createCampaign, DEFAULT_CAMPAIGN, type CampaignConfig };
