import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();

  // LaunchpadV2 new address
  const launchpadV2 = await ethers.getContractAt(
    "LaunchpadV2",
    "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    signer
  );

  console.log("\n=== Testing LaunchpadV2 ===\n");

  // Test getAllCampaignsPaginated
  try {
    const result = await launchpadV2.getAllCampaignsPaginated(0, 10);
    console.log("✅ getAllCampaignsPaginated works!");
    console.log("   Campaigns returned:", result[0].length);
    console.log("   Total campaigns:", result[1].toString());
    
    if (result[0].length > 0) {
      const campaign = result[0][0];
      console.log("\n   First Campaign:");
      console.log("   - ID:", campaign.id.toString());
      console.log("   - Name:", campaign.name);
      console.log("   - Symbol:", campaign.symbol);
      console.log("   - Creator:", campaign.creator);
      console.log("   - Is Active:", campaign.isActive);
    }
  } catch (error: any) {
    console.log("❌ getAllCampaignsPaginated failed:", error.message);
  }

  // Test getSummaryStats
  try {
    const stats = await launchpadV2.getSummaryStats();
    console.log("\n✅ getSummaryStats works!");
    console.log("   Total Campaigns:", stats[0].toString());
    console.log("   Active Campaigns:", stats[1].toString());
    console.log("   Completed Campaigns:", stats[2].toString());
  } catch (error: any) {
    console.log("\n❌ getSummaryStats failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
