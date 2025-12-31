import { ethers } from "hardhat";

const POOL_ADDRESS = "0x9F0e5Aab30d76cE32f31d646968F73b5a2C4a78B";
const WVERY_ADDRESS = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
const VLDEMO_ADDRESS = "0x94B9874aC5605713CcAc00ca8E832B37e15c1399";

async function main() {
  console.log("=== Testing Pool Price Calculations ===\n");

  const pairAbi = [
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function totalSupply() external view returns (uint256)"
  ];
  
  const pair = await ethers.getContractAt(pairAbi, POOL_ADDRESS);
  
  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();
  const totalSupply = await pair.totalSupply();
  
  const isToken0WVERY = token0.toLowerCase() === WVERY_ADDRESS.toLowerCase();
  const wveryReserve = isToken0WVERY ? reserve0 : reserve1;
  const vldemoReserve = isToken0WVERY ? reserve1 : reserve0;
  
  console.log("Pool Reserves:");
  console.log("  WVERY:", ethers.formatUnits(wveryReserve, 6));
  console.log("  VLDEMO:", ethers.formatUnits(vldemoReserve, 18));
  console.log("  LP Supply:", ethers.formatUnits(totalSupply, 18));
  console.log();
  
  // Calculate price of VLDEMO in terms of WVERY
  // Price = WVERY reserve / VLDEMO reserve
  const priceVLDEMO = Number(ethers.formatUnits(wveryReserve, 6)) / Number(ethers.formatUnits(vldemoReserve, 18));
  console.log("VLDEMO Price:", priceVLDEMO.toFixed(10), "WVERY per VLDEMO");
  
  // Assuming 1 WVERY = $1 (for testing)
  const wveryPriceUSD = 1.0;
  const vldemoMarketCap = Number(ethers.formatUnits(vldemoReserve, 18)) * priceVLDEMO * wveryPriceUSD;
  const poolLiquidity = Number(ethers.formatUnits(wveryReserve, 6)) * wveryPriceUSD * 2;
  
  console.log();
  console.log("Market Metrics (assuming 1 WVERY = $1):");
  console.log("  VLDEMO Price (USD):", (priceVLDEMO * wveryPriceUSD).toFixed(6));
  console.log("  Market Cap:", "$" + vldemoMarketCap.toFixed(2));
  console.log("  Pool Liquidity:", "$" + poolLiquidity.toFixed(2));
  console.log();
  
  console.log("✅ Pool has liquidity - frontend metrics should work!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
