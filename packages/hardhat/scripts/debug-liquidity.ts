import { ethers } from "hardhat";

const LAUNCHPADV2_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
const WVERY_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const VLDEMO_TOKEN_ADDRESS = "0x3B02fF1e626Ed7a8fd6eC5299e2C54e1421B626B";
const CAMPAIGN_ID = 1;
const POOL_ADDRESS = "0x500c1C2895FB9D7a627bcEA1C979dC88fcdbe30F";

async function main() {
  const [signer] = await ethers.getSigners();

  console.log("=== Debugging Liquidity Addition ===\n");
  console.log("Signer:", signer.address);

  // Get contract instances
  const launchpadV2 = await ethers.getContractAt("LaunchpadV2", LAUNCHPADV2_ADDRESS);
  const wvery = await ethers.getContractAt("WrappedVery", WVERY_ADDRESS);
  const tokenAbi = ["function balanceOf(address) view returns (uint256)", "function approve(address, uint256) returns (bool)", "function allowance(address, address) view returns (uint256)"];
  const token = await ethers.getContractAt(tokenAbi, VLDEMO_TOKEN_ADDRESS);

  const pairAbi = [
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function totalSupply() external view returns (uint256)",
    "function MINIMUM_LIQUIDITY() external view returns (uint256)"
  ];
  const pair = await ethers.getContractAt(pairAbi, POOL_ADDRESS);

  // Amounts
  const wveryAmount = ethers.parseUnits("100", 6); // 100 WVERY
  const tokenAmount = ethers.parseUnits("100000", 18); // 100k VLDEMO

  console.log("=== Amounts ===");
  console.log("WVERY Amount:", ethers.formatUnits(wveryAmount, 6));
  console.log("VLDEMO Amount:", ethers.formatUnits(tokenAmount, 18));
  console.log();

  // Check pool state
  console.log("=== Pool State ===");
  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();
  const token1 = await pair.token1();
  const totalSupply = await pair.totalSupply();
  const minLiq = await pair.MINIMUM_LIQUIDITY();

  console.log("Token0:", token0, token0 === VLDEMO_TOKEN_ADDRESS ? "(VLDEMO)" : "(WVERY)");
  console.log("Token1:", token1, token1 === WVERY_ADDRESS ? "(WVERY)" : "(VLDEMO)");
  console.log("Reserve0:", ethers.formatUnits(reserve0, 18), token0 === VLDEMO_TOKEN_ADDRESS ? "VLDEMO" : "WVERY");
  console.log("Reserve1:", ethers.formatUnits(reserve1, 6), token1 === WVERY_ADDRESS ? "WVERY" : "VLDEMO");
  console.log("Total Supply:", ethers.formatUnits(totalSupply, 18));
  console.log("Minimum Liquidity:", minLiq.toString());
  console.log();

  // Calculate expected liquidity
  console.log("=== Liquidity Calculation ===");
  if (totalSupply === 0n) {
    const amount0 = tokenAmount; // VLDEMO is token0
    const amount1 = wveryAmount; // WVERY is token1
    const product = amount0 * amount1;
    console.log("amount0 (VLDEMO):", amount0.toString());
    console.log("amount1 (WVERY):", amount1.toString());
    console.log("product:", product.toString());

    // Calculate square root manually
    const sqrt = (value: bigint): bigint => {
      if (value < 0n) return 0n;
      if (value < 4n) return value > 0n ? 1n : 0n;

      let z = value;
      let x = value / 2n + 1n;
      while (x < z) {
        z = x;
        x = (value / x + x) / 2n;
      }
      return z;
    };

    const sqrtValue = sqrt(product);
    const expectedLiquidity = sqrtValue - minLiq;

    console.log("sqrt(product):", sqrtValue.toString());
    console.log("Expected Liquidity:", expectedLiquidity.toString());
    console.log("Liquidity > 0?", expectedLiquidity > 0n);
    console.log();
  }

  // Check balances
  console.log("=== User Balances ===");
  const wveryBalance = await wvery.balanceOf(signer.address);
  const tokenBalance = await token.balanceOf(signer.address);
  console.log("WVERY Balance:", ethers.formatUnits(wveryBalance, 6));
  console.log("VLDEMO Balance:", ethers.formatUnits(tokenBalance, 18));
  console.log();

  // Check allowances
  console.log("=== Allowances for LaunchpadV2 ===");
  const wveryAllowance = await wvery.allowance(signer.address, LAUNCHPADV2_ADDRESS);
  const tokenAllowance = await token.allowance(signer.address, LAUNCHPADV2_ADDRESS);
  console.log("WVERY Allowance:", ethers.formatUnits(wveryAllowance, 6));
  console.log("VLDEMO Allowance:", ethers.formatUnits(tokenAllowance, 18));
  console.log();

  // Get campaign info
  console.log("=== Campaign Info ===");
  const campaignInfo = await launchpadV2.getAllCampaignsPaginated(0, 10);
  const campaign = campaignInfo[0][0]; // First campaign from the array
  console.log("Campaign ID:", campaign.id.toString());
  console.log("Is Funding Complete?", campaign.isFundingComplete);
  console.log("Uniswap Pair:", campaign.uniswapPair);
  console.log();

  // Try to diagnose the exact failure point
  console.log("=== Attempting Dry-run ===");
  if (wveryAllowance < wveryAmount || tokenAllowance < tokenAmount) {
    console.log("⚠️  Need to approve tokens first");
  } else if (wveryBalance < wveryAmount) {
    console.log("❌ Insufficient WVERY balance");
  } else if (tokenBalance < tokenAmount) {
    console.log("❌ Insufficient VLDEMO balance");
  } else {
    console.log("✅ All pre-checks passed");
    console.log("The issue must be in the router's addLiquidity call");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
