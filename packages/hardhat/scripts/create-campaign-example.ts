import { createCustomCampaign, type CampaignConfig } from "./create-campaign";

// Example: Create a campaign with custom parameters
async function createExampleCampaign() {
  const customConfig: Partial<CampaignConfig> = {
    name: "My Custom Token",
    symbol: "MCT",
    description: "This is a custom token for my project with specific parameters.",
    targetFunding: "5000", // 5,000 USDC
    totalSupply: "500000000", // 500 million tokens
    reserveRatio: 300000, // 30% reserve ratio
    deadlineDays: 14, // 14 days from now
  };

  try {
    await createCustomCampaign(customConfig);
  } catch (error) {
    console.error("Failed to create custom campaign:", error);
  }
}

// Run the example
if (require.main === module) {
  createExampleCampaign()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
