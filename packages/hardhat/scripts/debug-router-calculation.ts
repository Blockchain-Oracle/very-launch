import { ethers } from "hardhat";

const POOL_ADDRESS = "0x9F0e5Aab30d76cE32f31d646968F73b5a2C4a78B";
const WVERY_ADDRESS = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
const VLDEMO_TOKEN_ADDRESS = "0x94B9874aC5605713CcAc00ca8E832B37e15c1399";

async function main() {
  console.log("=== Debugging Router Calculation ===\n");

  const pairAbi = [
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)"
  ];
  
  const pair = await ethers.getContractAt(pairAbi, POOL_ADDRESS);
  
  const [reserve0Raw, reserve1Raw] = await pair.getReserves();
  const token0 = await pair.token0();
  const token1 = await pair.token1();
  
  console.log("Pool token ordering:");
  console.log("  token0:", token0);
  console.log("  token1:", token1);
  console.log();
  
  console.log("Raw reserves:");
  console.log("  reserve0:", reserve0Raw.toString());
  console.log("  reserve1:", reserve1Raw.toString());
  console.log();
  
  // Identify which is which
  const isToken0WVERY = token0.toLowerCase() === WVERY_ADDRESS.toLowerCase();
  const wveryReserveRaw = isToken0WVERY ? reserve0Raw : reserve1Raw;
  const vldemoReserveRaw = isToken0WVERY ? reserve1Raw : reserve0Raw;
  
  console.log("Identified reserves:");
  console.log("  WVERY reserve (raw):", wveryReserveRaw.toString());
  console.log("  WVERY reserve (formatted):", ethers.formatUnits(wveryReserveRaw, 6));
  console.log("  VLDEMO reserve (raw):", vldemoReserveRaw.toString());
  console.log("  VLDEMO reserve (formatted):", ethers.formatUnits(vldemoReserveRaw, 18));
  console.log();
  
  // Now simulate what the router will do
  console.log("Simulating router calculation:");
  console.log("We want to add:");
  const vldemoDesired = ethers.parseUnits("500", 18);
  const wveryDesired = ethers.parseUnits("100", 6);
  console.log("  VLDEMO desired:", ethers.formatUnits(vldemoDesired, 18));
  console.log("  WVERY desired:", ethers.formatUnits(wveryDesired, 6));
  console.log();
  
  // Router calls getReserves(tokenA, tokenB) where tokenA=VLDEMO, tokenB=WVERY
  // getReserves will return reserves in the order of the tokens we pass
  console.log("Router gets reserves for (VLDEMO, WVERY):");
  console.log("  reserveA (VLDEMO):", vldemoReserveRaw.toString());
  console.log("  reserveB (WVERY):", wveryReserveRaw.toString());
  console.log();
  
  // Router calculates optimal WVERY amount
  // quote(amountA, reserveA, reserveB) = amountA * reserveB / reserveA
  const wveryOptimal = (vldemoDesired * wveryReserveRaw) / vldemoReserveRaw;
  console.log("Router calculates:");
  console.log("  wveryOptimal = vldemoDesired * wveryReserve / vldemoReserve");
  console.log("  wveryOptimal =", vldemoDesired.toString(), "*", wveryReserveRaw.toString(), "/", vldemoReserveRaw.toString());
  console.log("  wveryOptimal (raw) =", wveryOptimal.toString());
  console.log("  wveryOptimal (formatted) =", ethers.formatUnits(wveryOptimal, 6));
  console.log();
  
  const wveryMin = (wveryDesired * 98n) / 100n;
  console.log("Our minimum WVERY:", ethers.formatUnits(wveryMin, 6));
  console.log();
  
  if (wveryOptimal >= wveryMin) {
    console.log("✅ wveryOptimal >= wveryMin - Should work!");
  } else {
    console.log("❌ wveryOptimal < wveryMin - Will fail with INSUFFICIENT_B_AMOUNT!");
    console.log("  Difference:", ethers.formatUnits(wveryMin - wveryOptimal, 6), "WVERY short");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
