import { ethers } from "hardhat";
import hre from "hardhat";

/**
 * Complete Development Environment Setup Script
 *
 * This script sets up everything from scratch:
 * 1. Deploys all contracts (via hardhat-deploy)
 * 2. Wraps VERY tokens for liquidity
 * 3. Creates 3-4 test campaigns
 * 4. Adds liquidity to each campaign pool
 * 5. Performs test swaps
 */

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║   VeryLaunch - Full Development Environment Setup        ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  // On Very Network (single signer), use deployer for all roles
  const user1 = signers[1] || deployer;
  const user2 = signers[2] || deployer;

  const network = await ethers.provider.getNetwork();
  const isVeryNetwork = network.chainId === 4613n;

  console.log("Network:", isVeryNetwork ? "Very Network (4613)" : `Chain ID ${network.chainId}`);
  console.log("Deployer:", deployer.address);
  if (signers.length > 1) {
    console.log("User1:", user1.address);
    console.log("User2:", user2.address);
  } else {
    console.log("(Single signer mode - deployer used for all operations)");
  }
  console.log();

  // ============================================================================
  // STEP 1: Deploy All Contracts (skip on Very Network if already deployed)
  // ============================================================================
  console.log("📦 STEP 1: Checking/Deploying contracts...\n");

  // Check if contracts are already deployed
  let alreadyDeployed = false;
  try {
    await hre.deployments.get("WrappedVery");
    await hre.deployments.get("Launchpad");
    alreadyDeployed = true;
    console.log("✅ Contracts already deployed, skipping deployment step.\n");
  } catch {
    // Contracts not deployed, run deploy
    console.log("Deploying all contracts...");
    await hre.run("deploy");
    console.log("✅ All contracts deployed!\n");
  }

  // Get deployed contract addresses
  const wveryDeployment = await hre.deployments.get("WrappedVery");
  const launchpadDeployment = await hre.deployments.get("Launchpad");
  const launchpadV2Deployment = await hre.deployments.get("LaunchpadV2");
  const routerDeployment = await hre.deployments.get("BumdexRouter");

  const WVERY_ADDRESS = wveryDeployment.address;
  const LAUNCHPAD_ADDRESS = launchpadDeployment.address;
  const LAUNCHPADV2_ADDRESS = launchpadV2Deployment.address;
  const ROUTER_ADDRESS = routerDeployment.address;

  console.log("Contract Addresses:");
  console.log("  WrappedVery:", WVERY_ADDRESS);
  console.log("  Launchpad:", LAUNCHPAD_ADDRESS);
  console.log("  LaunchpadV2:", LAUNCHPADV2_ADDRESS);
  console.log("  BumdexRouter:", ROUTER_ADDRESS);
  console.log();

  // ============================================================================
  // STEP 2: Distribute WVERY Tokens
  // ============================================================================
  console.log("💰 STEP 2: Distributing WVERY tokens to test users...\n");

  const wvery = await ethers.getContractAt("WrappedVery", WVERY_ADDRESS);

  // Deployer already has 100,000 WVERY from constructor
  const deployerBalance = await wvery.balanceOf(deployer.address);
  console.log("Deployer already has:", ethers.formatUnits(deployerBalance, 6), "WVERY");

  // Mint WVERY for user1 (using mint function: amount * 50000e6)
  console.log("Minting WVERY for user1...");
  await wvery.mint(user1.address, 1); // Mints 1 * 50000 = 50,000 WVERY
  console.log("✅ User1 received 50,000 WVERY");

  // Mint WVERY for user2
  console.log("Minting WVERY for user2...");
  await wvery.mint(user2.address, 1); // Mints 1 * 50000 = 50,000 WVERY
  console.log("✅ User2 received 50,000 WVERY\n");

  // ============================================================================
  // STEP 3: Create Test Campaigns
  // ============================================================================
  console.log("🚀 STEP 3: Creating test campaigns...\n");

  const launchpad = await ethers.getContractAt("Launchpad", LAUNCHPAD_ADDRESS);
  const launchpadV2 = await ethers.getContractAt("LaunchpadV2", LAUNCHPADV2_ADDRESS);

  const campaigns = [
    {
      name: "AlphaToken",
      symbol: "ALPHA",
      description: "A revolutionary DeFi token for the future",
      targetFunding: ethers.parseUnits("500", 6), // 500 WVERY (uint128)
      totalSupply: ethers.parseUnits("10000000", 18), // 10M tokens (uint128)
      reserveRatio: 500000, // 50% (uint32, out of 1,000,000)
      deadline: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days (uint64)
    },
    {
      name: "BetaToken",
      symbol: "BETA",
      description: "Next-gen gaming token with real utility",
      targetFunding: ethers.parseUnits("1000", 6), // 1000 WVERY
      totalSupply: ethers.parseUnits("5000000", 18), // 5M tokens
      reserveRatio: 600000, // 60%
      deadline: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60, // 14 days
    },
    {
      name: "GammaToken",
      symbol: "GAMMA",
      description: "The ultimate NFT marketplace governance token",
      targetFunding: ethers.parseUnits("2000", 6), // 2000 WVERY
      totalSupply: ethers.parseUnits("20000000", 18), // 20M tokens
      reserveRatio: 700000, // 70%
      deadline: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    },
  ];

  const campaignIds: number[] = [];
  const tokenAddresses: string[] = [];

  for (let i = 0; i < campaigns.length; i++) {
    const campaign = campaigns[i];
    console.log(`Creating Campaign ${i + 1}: ${campaign.name} (${campaign.symbol})`);
    console.log(`  Total Supply: ${ethers.formatUnits(campaign.totalSupply, 18)}`);
    console.log(`  Target Funding: ${ethers.formatUnits(campaign.targetFunding, 6)} WVERY`);
    console.log(`  Reserve Ratio: ${campaign.reserveRatio / 10000}%`);

    const tx = await launchpad.createCampaign(
      campaign.name,
      campaign.symbol,
      campaign.description,
      campaign.targetFunding,
      campaign.totalSupply,
      campaign.reserveRatio,
      campaign.deadline
    );
    await tx.wait();

    const campaignId = i + 1;
    campaignIds.push(campaignId);

    const campaignData = await launchpad.campaigns(campaignId);
    tokenAddresses.push(campaignData.token);

    console.log(`✅ Campaign ${campaignId} created! Token: ${campaignData.token}\n`);
  }

  // ============================================================================
  // STEP 4: Buy Tokens (fund campaigns using bonding curve)
  // ============================================================================
  console.log("💸 STEP 4: Buying tokens to fund campaigns...\n");

  for (let i = 0; i < campaignIds.length; i++) {
    const campaignId = campaignIds[i];
    const campaign = campaigns[i];

    console.log(`Buying tokens for Campaign ${campaignId} (${campaign.name})...`);

    // Buy tokens with full target funding
    const buyAmount = campaign.targetFunding;

    // Approve WVERY
    await wvery.approve(LAUNCHPAD_ADDRESS, buyAmount);

    // Buy tokens using bonding curve
    await launchpad.buyTokens(campaignId, buyAmount);
    console.log(`✅ Bought tokens with ${ethers.formatUnits(buyAmount, 6)} WVERY\n`);
  }

  // ============================================================================
  // STEP 5: Add Liquidity to All Pools
  // ============================================================================
  console.log("🌊 STEP 5: Adding liquidity to all pools...\n");

  for (let i = 0; i < campaignIds.length; i++) {
    const campaignId = campaignIds[i];
    const campaign = campaigns[i];
    const tokenAddress = tokenAddresses[i];

    // Check if campaign has pool address
    const campaignData = await launchpad.campaigns(campaignId);
    if (campaignData.poolAddress === ethers.ZeroAddress) {
      console.log(`⚠️  Campaign ${campaignId} doesn't have a pool yet (needs to reach funding goal)\n`);
      continue;
    }

    console.log(`Adding liquidity to ${campaign.name} pool...`);

    // Calculate liquidity amounts (10% of target funding + matching tokens)
    const wveryLiquidity = (campaign.targetFunding * 10n) / 100n;
    const tokenLiquidity = ethers.parseUnits("100000", 18); // 100k tokens

    const token = await ethers.getContractAt("ERC20", tokenAddress);

    // Approve tokens
    await wvery.approve(LAUNCHPADV2_ADDRESS, wveryLiquidity);
    await token.approve(LAUNCHPADV2_ADDRESS, tokenLiquidity);

    // Add liquidity
    const minWvery = (wveryLiquidity * 95n) / 100n; // 5% slippage tolerance
    const minToken = (tokenLiquidity * 95n) / 100n;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

    await launchpadV2.addLiquidityToPool(
      campaignId,
      tokenLiquidity,
      wveryLiquidity,
      minToken,
      minWvery,
      deadline
    );

    console.log(`✅ Added ${ethers.formatUnits(wveryLiquidity, 6)} WVERY + ${ethers.formatUnits(tokenLiquidity, 18)} ${campaign.symbol}`);
    console.log(`   Pool: ${campaignData.poolAddress}\n`);
  }

  // ============================================================================
  // STEP 6: Perform Test Swaps
  // ============================================================================
  console.log("🔄 STEP 6: Performing test swaps...\n");

  const router = await ethers.getContractAt("BumdexRouter", ROUTER_ADDRESS);

  for (let i = 0; i < Math.min(2, campaignIds.length); i++) {
    const tokenAddress = tokenAddresses[i];
    const campaign = campaigns[i];

    console.log(`Test swap for ${campaign.name}...`);

    // Swap 10 WVERY for tokens
    const wveryIn = ethers.parseUnits("10", 6);
    await wvery.approve(ROUTER_ADDRESS, wveryIn);

    const path = [WVERY_ADDRESS, tokenAddress];
    const amountsOut = await router.getAmountsOut(wveryIn, path);
    const minOut = (amountsOut[1] * 95n) / 100n; // 5% slippage
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

    await router.swapExactTokensForTokens(
      wveryIn,
      minOut,
      path,
      deployer.address,
      deadline
    );

    console.log(`✅ Swapped ${ethers.formatUnits(wveryIn, 6)} WVERY → ${ethers.formatEther(amountsOut[1])} ${campaign.symbol}\n`);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║                    SETUP COMPLETE! ✅                     ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  console.log("📊 Summary:");
  console.log(`   • ${campaignIds.length} campaigns created and funded`);
  console.log(`   • ${campaignIds.length} liquidity pools active`);
  console.log(`   • Test swaps completed`);
  console.log(`   • Frontend should show live data\n`);

  console.log("🎯 Campaign IDs:");
  for (let i = 0; i < campaignIds.length; i++) {
    const campaign = campaigns[i];
    const campaignData = await launchpad.campaigns(campaignIds[i]);
    console.log(`   ${campaignIds[i]}. ${campaign.name} (${campaign.symbol})`);
    console.log(`      Token: ${tokenAddresses[i]}`);
    console.log(`      Pool:  ${campaignData.poolAddress}`);
  }
  console.log();

  console.log("💡 Next Steps:");
  console.log("   1. Open frontend at http://localhost:3000");
  console.log("   2. Connect wallet with deployer address");
  console.log("   3. Browse campaigns and view pool metrics");
  console.log("   4. Test swaps and liquidity operations\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
