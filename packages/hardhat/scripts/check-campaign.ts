import { ethers } from "hardhat";

const LAUNCHPAD_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";

async function main() {
  console.log("Checking Campaign #1...\n");

  const launchpad = await ethers.getContractAt("Launchpad", LAUNCHPAD_ADDRESS);

  const campaign = await launchpad.campaigns(1);

  console.log("Campaign Details:");
  console.log("  Name:", campaign.name);
  console.log("  Symbol:", campaign.symbol);
  console.log("  Token Address:", campaign.token);
  console.log("  Uniswap Pair:", campaign.uniswapPair);
  console.log("  Funding Complete:", campaign.isFundingComplete);
  console.log("  Amount Raised:", ethers.formatUnits(campaign.amountRaised, 6), "WVERY");
  console.log("  Tokens Sold:", ethers.formatUnits(campaign.tokensSold, 18));
  console.log();

  if (campaign.uniswapPair === ethers.ZeroAddress) {
    console.log("❌ No liquidity pool exists for this campaign");
  } else {
    console.log("✅ Liquidity pool exists at:", campaign.uniswapPair);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
