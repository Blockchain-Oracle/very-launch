import { ethers } from "hardhat";

const ROUTER_ADDRESS = "0x9d4454B023096f34B160D6B654540c56A1F81688";
const EXPECTED_FACTORY = "0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf";

async function main() {
  console.log("=== Checking Router's Factory Address ===\n");

  const routerAbi = [
    "function factory() external view returns (address)"
  ];

  const router = await ethers.getContractAt(routerAbi, ROUTER_ADDRESS);

  const routerFactory = await router.factory();
  console.log("Router's factory address:", routerFactory);
  console.log("Expected factory address:", EXPECTED_FACTORY);

  if (routerFactory.toLowerCase() === EXPECTED_FACTORY.toLowerCase()) {
    console.log("✅ Router is using the correct factory");
  } else {
    console.log("❌ ROUTER IS USING WRONG FACTORY!");
    console.log("This explains why addLiquidity fails!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
