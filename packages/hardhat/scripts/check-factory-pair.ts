import { ethers } from "hardhat";

const FACTORY_ADDRESS = "0x59b670e9fA9D0A427751Af201D676719a970857b";
const WVERY_ADDRESS = "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f";
const VLDEMO_TOKEN_ADDRESS = "0xe73bc5BD4763A3307AB5F8F126634b7E12E3dA9b";
const EXPECTED_POOL_ADDRESS = "0xAF4262D8557B4C3Fb5AC8Fe58a646CDd985583Dc";

async function main() {
  console.log("=== Checking Factory Pair Registration ===\n");

  const factoryAbi = [
    "function getPair(address tokenA, address tokenB) external view returns (address pair)",
    "function allPairs(uint) external view returns (address pair)",
    "function allPairsLength() external view returns (uint)"
  ];

  const factory = await ethers.getContractAt(factoryAbi, FACTORY_ADDRESS);

  // Check if pair exists for these tokens
  console.log("Checking getPair(VLDEMO, WVERY)...");
  const pairAddress = await factory.getPair(VLDEMO_TOKEN_ADDRESS, WVERY_ADDRESS);
  console.log("Pair address from factory:", pairAddress);
  console.log("Expected pool address:", EXPECTED_POOL_ADDRESS);

  if (pairAddress === ethers.ZeroAddress) {
    console.log("❌ PAIR NOT REGISTERED IN FACTORY!");
    console.log("This is the problem - the factory doesn't know about the pair!");
  } else if (pairAddress.toLowerCase() === EXPECTED_POOL_ADDRESS.toLowerCase()) {
    console.log("✅ Pair is registered correctly");
  } else {
    console.log("⚠️  Pair exists but address mismatch!");
    console.log("Factory says:", pairAddress);
    console.log("Campaign says:", EXPECTED_POOL_ADDRESS);
  }
  console.log();

  // Check all pairs in factory
  const pairsLength = await factory.allPairsLength();
  console.log("Total pairs in factory:", pairsLength.toString());

  if (pairsLength > 0n) {
    console.log("\nAll pairs in factory:");
    for (let i = 0; i < Number(pairsLength); i++) {
      const pair = await factory.allPairs(i);
      console.log(`  Pair ${i}:`, pair);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
