import { ethers } from "hardhat";

const POOL_ADDRESS = "0x9F0e5Aab30d76cE32f31d646968F73b5a2C4a78B";

async function main() {
  console.log("Checking pool reserves...\n");

  const pairAbi = [
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function totalSupply() external view returns (uint256)",
  ];

  const pair = await ethers.getContractAt(pairAbi, POOL_ADDRESS);

  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();
  const token1 = await pair.token1();
  const totalSupply = await pair.totalSupply();

  console.log("Pool Address:", POOL_ADDRESS);
  console.log("Token0 (VLDEMO):", token0);
  console.log("Token1 (WVERY):", token1);
  console.log("\nReserves:");
  console.log("  Reserve0:", ethers.formatUnits(reserve0, 18), "VLDEMO");
  console.log("  Reserve1:", ethers.formatUnits(reserve1, 6), "WVERY");
  console.log("  LP Total Supply:", ethers.formatUnits(totalSupply, 18));
  
  if (reserve0 === 0n && reserve1 === 0n) {
    console.log("\n❌ POOL IS EMPTY - No liquidity added yet!");
    console.log("This is why everything shows $0 and swaps don't work.");
  } else {
    console.log("\n✅ Pool has liquidity");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
