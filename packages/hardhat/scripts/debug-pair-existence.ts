import { ethers } from "hardhat";

const FACTORY_ADDRESS = "0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf";
const WVERY_ADDRESS = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
const VLDEMO_TOKEN_ADDRESS = "0x94B9874aC5605713CcAc00ca8E832B37e15c1399";
const POOL_ADDRESS = "0x9F0e5Aab30d76cE32f31d646968F73b5a2C4a78B";

async function main() {
  console.log("=== Debugging Pair Existence in Factory ===\n");
  
  const factoryAbi = ["function getPair(address, address) view returns (address)"];
  const factory = await ethers.getContractAt(factoryAbi, FACTORY_ADDRESS);
  
  // Try both orderings
  console.log("Checking getPair(VLDEMO, WVERY):");
  const pair1 = await factory.getPair(VLDEMO_TOKEN_ADDRESS, WVERY_ADDRESS);
  console.log("  Result:", pair1);
  console.log("  Expected:", POOL_ADDRESS);
  console.log("  Match?", pair1 === POOL_ADDRESS);
  console.log();
  
  console.log("Checking getPair(WVERY, VLDEMO):");
  const pair2 = await factory.getPair(WVERY_ADDRESS, VLDEMO_TOKEN_ADDRESS);
  console.log("  Result:", pair2);
  console.log("  Expected:", POOL_ADDRESS);
  console.log("  Match?", pair2 === POOL_ADDRESS);
  console.log();
  
  // Check sorted token order
  const sortedTokens = WVERY_ADDRESS < VLDEMO_TOKEN_ADDRESS 
    ? [WVERY_ADDRESS, VLDEMO_TOKEN_ADDRESS]
    : [VLDEMO_TOKEN_ADDRESS, WVERY_ADDRESS];
  
  console.log("Sorted token order (lower address first):");
  console.log("  token0:", sortedTokens[0]);
  console.log("  token1:", sortedTokens[1]);
  console.log();
  
  console.log("Checking getPair with sorted order:");
  const pair3 = await factory.getPair(sortedTokens[0], sortedTokens[1]);
  console.log("  Result:", pair3);
  console.log("  Match?", pair3 === POOL_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
