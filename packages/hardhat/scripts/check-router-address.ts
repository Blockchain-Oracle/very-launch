import { ethers } from "hardhat";

async function main() {
  console.log("=== Checking Router Addresses ===\n");

  const LAUNCHPADV2_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
  const ROUTER_EXPECTED = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const FACTORY_EXPECTED = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const WVERY_EXPECTED = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  const launchpadV2 = await ethers.getContractAt("LaunchpadV2", LAUNCHPADV2_ADDRESS);

  // Get router address from LaunchpadV2
  const routerFromContract = await launchpadV2.uniswapRouter();
  console.log("Router address in LaunchpadV2:", routerFromContract);
  console.log("Expected router address:", ROUTER_EXPECTED);

  if (routerFromContract === ROUTER_EXPECTED) {
    console.log("✅ Router addresses match!");
  } else {
    console.log("❌ ROUTER ADDRESS MISMATCH!");
    console.log("This is the problem - LaunchpadV2 is using the wrong router address");
  }

  // Also check factory
  const factoryFromContract = await launchpadV2.uniswapFactory();
  console.log("\nFactory address in LaunchpadV2:", factoryFromContract);
  console.log("Expected factory address:", FACTORY_EXPECTED);

  if (factoryFromContract === FACTORY_EXPECTED) {
    console.log("✅ Factory addresses match!");
  } else {
    console.log("❌ FACTORY ADDRESS MISMATCH!");
  }

  // Check WVERY address
  const wveryFromContract = await launchpadV2.usdcToken();
  console.log("\nWVERY address in LaunchpadV2:", wveryFromContract);
  console.log("Expected WVERY address:", WVERY_EXPECTED);

  if (wveryFromContract === WVERY_EXPECTED) {
    console.log("✅ WVERY addresses match!");
  } else {
    console.log("❌ WVERY ADDRESS MISMATCH!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
