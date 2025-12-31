import { ethers } from "hardhat";

async function main() {
  const LAUNCHPADV2_ADDRESS = "0x5f3f1dBD7B74C6B46e8c44f98792A1dAf8d69154";
  const EXPECTED_ROUTER = "0x9d4454B023096f34B160D6B654540c56A1F81688";
  const EXPECTED_FACTORY = "0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf";
  const EXPECTED_WVERY = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";

  console.log("=== Verifying LaunchpadV2 Configuration ===\n");

  const launchpadV2 = await ethers.getContractAt("LaunchpadV2", LAUNCHPADV2_ADDRESS);

  const router = await launchpadV2.uniswapRouter();
  const factory = await launchpadV2.uniswapFactory();
  const wvery = await launchpadV2.usdcToken();

  console.log("LaunchpadV2 Router:", router);
  console.log("Expected Router:", EXPECTED_ROUTER);
  console.log(router === EXPECTED_ROUTER ? "✅ MATCH" : "❌ MISMATCH");
  console.log();

  console.log("LaunchpadV2 Factory:", factory);
  console.log("Expected Factory:", EXPECTED_FACTORY);
  console.log(factory === EXPECTED_FACTORY ? "✅ MATCH" : "❌ MISMATCH");
  console.log();

  console.log("LaunchpadV2 WVERY:", wvery);
  console.log("Expected WVERY:", EXPECTED_WVERY);
  console.log(wvery === EXPECTED_WVERY ? "✅ MATCH" : "❌ MISMATCH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
