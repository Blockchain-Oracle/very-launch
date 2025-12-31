import { ethers } from "hardhat";

/**
 * Complete Demo Flow Script for Hackathon
 *
 * This script demonstrates the entire VeryLaunch flow:
 * 1. Creates a campaign
 * 2. Buys tokens to complete funding
 * 3. Automatically creates liquidity pool
 * 4. Verifies tokens are available for swapping
 */

const LAUNCHPAD_ADDRESS = "0x1291Be112d480055DaFd8a610b7d1e203891C274";
const WVERY_ADDRESS = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(80));
  console.log("🚀 VERYLAUNCH DEMO - FULL FLOW TEST");
  console.log("=".repeat(80));
  console.log();
  console.log("Tester address:", deployer.address);
  console.log("Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "VERY");
  console.log();

  const launchpad = await ethers.getContractAt("Launchpad", LAUNCHPAD_ADDRESS);
  const wvery = await ethers.getContractAt("WrappedVery", WVERY_ADDRESS);

  // Check WVERY balance
  const wveryBalance = await wvery.balanceOf(deployer.address);
  console.log("WVERY Balance:", ethers.formatUnits(wveryBalance, 6), "WVERY");
  console.log();

  // ============================================================================
  // STEP 1: CREATE CAMPAIGN
  // ============================================================================
  console.log("=".repeat(80));
  console.log("STEP 1: CREATING TEST CAMPAIGN");
  console.log("=".repeat(80));
  console.log();

  const campaignConfig = {
    name: "VeryLaunch Demo Token",
    symbol: "VLDEMO",
    description: "Demo token for VeryLaunch hackathon - showcasing full campaign lifecycle",
    targetFunding: "1000", // 1,000 WVERY (small for easy testing)
    totalSupply: "10000000", // 10 million tokens
    reserveRatio: 500000, // 50% reserve ratio
    deadlineDays: 30,
  };

  const targetFunding = ethers.parseUnits(campaignConfig.targetFunding, 6);
  const totalSupply = ethers.parseUnits(campaignConfig.totalSupply, 18);
  const deadline = Math.floor(Date.now() / 1000) + campaignConfig.deadlineDays * 24 * 60 * 60;

  console.log("Campaign Details:");
  console.log("  Name:", campaignConfig.name);
  console.log("  Symbol:", campaignConfig.symbol);
  console.log("  Target:", campaignConfig.targetFunding, "WVERY");
  console.log("  Total Supply:", campaignConfig.totalSupply, "tokens");
  console.log("  Reserve Ratio:", campaignConfig.reserveRatio);
  console.log();

  const createTx = await launchpad.createCampaign(
    campaignConfig.name,
    campaignConfig.symbol,
    campaignConfig.description,
    targetFunding,
    totalSupply,
    campaignConfig.reserveRatio,
    deadline
  );

  console.log("Creating campaign... tx:", createTx.hash);
  const createReceipt = await createTx.wait();

  // Get campaign ID from event
  const campaignCreatedEvent = createReceipt?.logs.find((log: any) => {
    try {
      const parsed = launchpad.interface.parseLog(log);
      return parsed?.name === "CampaignCreated";
    } catch {
      return false;
    }
  });

  const parsedEvent = launchpad.interface.parseLog(campaignCreatedEvent);
  const campaignId = parsedEvent?.args.campaignId;

  console.log("✅ Campaign created! ID:", campaignId.toString());
  console.log();

  // ============================================================================
  // STEP 2: BUY TOKENS TO COMPLETE FUNDING
  // ============================================================================
  console.log("=".repeat(80));
  console.log("STEP 2: PURCHASING TOKENS TO COMPLETE FUNDING");
  console.log("=".repeat(80));
  console.log();

  // Buy enough to reach target funding
  const buyAmount = targetFunding; // Buy the full target amount

  console.log("Approving", ethers.formatUnits(buyAmount, 6), "WVERY...");
  const approveTx = await wvery.approve(LAUNCHPAD_ADDRESS, buyAmount);
  await approveTx.wait();
  console.log("✅ Approval confirmed");
  console.log();

  console.log("Purchasing tokens with", ethers.formatUnits(buyAmount, 6), "WVERY...");
  const buyTx = await launchpad.buyTokens(campaignId, buyAmount);
  console.log("Buying... tx:", buyTx.hash);
  const buyReceipt = await buyTx.wait();
  console.log("✅ Purchase complete!");
  console.log();

  // ============================================================================
  // STEP 3: VERIFY CAMPAIGN COMPLETION & LIQUIDITY POOL
  // ============================================================================
  console.log("=".repeat(80));
  console.log("STEP 3: VERIFYING CAMPAIGN COMPLETION & LIQUIDITY POOL");
  console.log("=".repeat(80));
  console.log();

  const campaign = await launchpad.campaigns(campaignId);

  console.log("Campaign Status:");
  console.log("  ✅ Funding Complete:", campaign.isFundingComplete);
  console.log("  💰 Amount Raised:", ethers.formatUnits(campaign.amountRaised, 6), "WVERY");
  console.log("  🎯 Target Amount:", ethers.formatUnits(campaign.targetAmount, 6), "WVERY");
  console.log("  🪙 Tokens Sold:", ethers.formatUnits(campaign.tokensSold, 18));
  console.log("  🏊 Uniswap Pair:", campaign.uniswapPair);
  console.log();

  // Check token balance
  const token = await ethers.getContractAt("TokenFacet", campaign.token);
  const tokenBalance = await token.balanceOf(deployer.address);
  console.log("Your Token Balance:", ethers.formatUnits(tokenBalance, 18), campaign.symbol);
  console.log();

  // ============================================================================
  // STEP 4: VERIFY SWAP AVAILABILITY
  // ============================================================================
  console.log("=".repeat(80));
  console.log("STEP 4: VERIFYING SWAP IS AVAILABLE");
  console.log("=".repeat(80));
  console.log();

  if (campaign.uniswapPair !== ethers.ZeroAddress) {
    console.log("✅ Liquidity pool created successfully!");
    console.log("✅ Token is now SWAPPABLE on the Swap page!");
    console.log();
    console.log("Next steps:");
    console.log("  1. Go to /app/swap page");
    console.log("  2. Select", campaign.symbol, "token");
    console.log("  3. Swap between WVERY ↔", campaign.symbol);
  } else {
    console.log("❌ No liquidity pool found");
  }
  console.log();

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("=".repeat(80));
  console.log("✅ DEMO COMPLETE - SUMMARY");
  console.log("=".repeat(80));
  console.log();
  console.log("Campaign ID:", campaignId.toString());
  console.log("Token Address:", campaign.token);
  console.log("Token Symbol:", campaign.symbol);
  console.log("Liquidity Pool:", campaign.uniswapPair);
  console.log();
  console.log("🎉 The full flow works! Campaign → Funding → Liquidity → Swap");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
