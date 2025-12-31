import { ethers } from "hardhat";

const LAUNCHPADV2_ADDRESS = "0x5f3f1dBD7B74C6B46e8c44f98792A1dAf8d69154";
const WVERY_ADDRESS = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
const VLDEMO_TOKEN_ADDRESS = "0x94B9874aC5605713CcAc00ca8E832B37e15c1399";
const CAMPAIGN_ID = 1;

async function main() {
  const [signer] = await ethers.getSigners();
  
  console.log("Adding initial liquidity to pool...\n");
  console.log("Signer:", signer.address);
  
  const launchpadV2 = await ethers.getContractAt("LaunchpadV2", LAUNCHPADV2_ADDRESS);
  const wvery = await ethers.getContractAt("WrappedVery", WVERY_ADDRESS);
  const tokenAbi = ["function balanceOf(address) view returns (uint256)", "function approve(address, uint256) returns (bool)"];
  const token = await ethers.getContractAt(tokenAbi, VLDEMO_TOKEN_ADDRESS);
  
  // Add liquidity matching the pool's existing 5000:1 ratio
  // Current ratio: 5000 VLDEMO per 1 WVERY
  // Pool has: 500 WVERY + 2,500,000 VLDEMO
  const wveryAmount = ethers.parseUnits("100", 6); // 100 WVERY (6 decimals)
  const tokenAmount = ethers.parseUnits("500000", 18); // 500,000 VLDEMO tokens (matches 5000:1 ratio)
  
  console.log("Liquidity to add:");
  console.log("  WVERY:", ethers.formatUnits(wveryAmount, 6));
  console.log("  VLDEMO:", ethers.formatUnits(tokenAmount, 18));
  console.log();
  
  // Check balances
  const wveryBalance = await wvery.balanceOf(signer.address);
  const tokenBalance = await token.balanceOf(signer.address);
  
  console.log("Your balances:");
  console.log("  WVERY:", ethers.formatUnits(wveryBalance, 6));
  console.log("  VLDEMO:", ethers.formatUnits(tokenBalance, 18));
  console.log();
  
  if (wveryBalance < wveryAmount) {
    console.error("❌ Insufficient WVERY balance!");
    return;
  }
  
  if (tokenBalance < tokenAmount) {
    console.error("❌ Insufficient VLDEMO balance!");
    return;
  }
  
  // Approve tokens
  console.log("Approving WVERY...");
  const wveryApproveTx = await wvery.approve(LAUNCHPADV2_ADDRESS, wveryAmount);
  await wveryApproveTx.wait();
  console.log("✅ WVERY approved");
  
  console.log("Approving VLDEMO...");
  const tokenApproveTx = await token.approve(LAUNCHPADV2_ADDRESS, tokenAmount);
  await tokenApproveTx.wait();
  console.log("✅ VLDEMO approved");
  console.log();
  
  // Add liquidity with 2% slippage tolerance
  const minTokenLiquidity = (tokenAmount * 98n) / 100n;
  const minWveryLiquidity = (wveryAmount * 98n) / 100n;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10); // 10 minutes
  
  console.log("Adding liquidity to pool...");
  const addLiquidityTx = await launchpadV2.addLiquidityToPool(
    CAMPAIGN_ID,
    tokenAmount,
    wveryAmount,
    minTokenLiquidity,
    minWveryLiquidity,
    deadline
  );
  
  console.log("Transaction hash:", addLiquidityTx.hash);
  const receipt = await addLiquidityTx.wait();
  console.log("✅ Liquidity added successfully!");
  console.log();
  
  // Verify pool now has liquidity
  const pairAbi = ["function getReserves() external view returns (uint112, uint112, uint32)"];
  const poolAddress = "0x9F0e5Aab30d76cE32f31d646968F73b5a2C4a78B";
  const pair = await ethers.getContractAt(pairAbi, poolAddress);
  const [reserve0, reserve1] = await pair.getReserves();
  
  console.log("Pool reserves after adding liquidity:");
  console.log("  Reserve0 (VLDEMO):", ethers.formatUnits(reserve0, 18));
  console.log("  Reserve1 (WVERY):", ethers.formatUnits(reserve1, 6));
  console.log();
  console.log("✅ Pool is now active! You can swap tokens.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
