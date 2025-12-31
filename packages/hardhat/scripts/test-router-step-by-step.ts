import { ethers } from "hardhat";

const ROUTER_ADDRESS = "0x9d4454B023096f34B160D6B654540c56A1F81688";
const FACTORY_ADDRESS = "0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf";
const WVERY_ADDRESS = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
const VLDEMO_TOKEN_ADDRESS = "0x94B9874aC5605713CcAc00ca8E832B37e15c1399";
const POOL_ADDRESS = "0x9F0e5Aab30d76cE32f31d646968F73b5a2C4a78B";

async function main() {
  const [signer] = await ethers.getSigners();

  console.log("=== Testing Router Step by Step ===\n");

  const wvery = await ethers.getContractAt("WrappedVery", WVERY_ADDRESS);
  const tokenAbi = ["function balanceOf(address) view returns (uint256)", "function approve(address, uint256) returns (bool)", "function allowance(address, address) view returns (uint256)"];
  const token = await ethers.getContractAt(tokenAbi, VLDEMO_TOKEN_ADDRESS);

  const pairAbi = [
    "function getReserves() external view returns (uint112, uint112, uint32)",
    "function balanceOf(address) view returns (uint256)",
    "function token0() view returns (address)",
    "function token1() view returns (address)"
  ];
  const pair = await ethers.getContractAt(pairAbi, POOL_ADDRESS);

  const factoryAbi = ["function getPair(address, address) view returns (address)"];
  const factory = await ethers.getContractAt(factoryAbi, FACTORY_ADDRESS);

  // Check pair exists in factory
  console.log("Step 1: Verify pair exists in factory");
  const pairFromFactory = await factory.getPair(VLDEMO_TOKEN_ADDRESS, WVERY_ADDRESS);
  console.log("Pair from factory:", pairFromFactory);
  console.log("Expected pair:", POOL_ADDRESS);
  console.log(pairFromFactory === POOL_ADDRESS ? "✅ Match" : "❌ Mismatch");
  console.log();

  // Check token ordering
  console.log("Step 2: Check token ordering in pair");
  const token0 = await pair.token0();
  const token1 = await pair.token1();
  console.log("Pair token0:", token0);
  console.log("Pair token1:", token1);
  console.log("VLDEMO:", VLDEMO_TOKEN_ADDRESS);
  console.log("WVERY:", WVERY_ADDRESS);
  console.log();

  // Check initial reserves
  console.log("Step 3: Check pair reserves");
  const [reserve0, reserve1] = await pair.getReserves();
  console.log("Reserve0:", ethers.formatUnits(reserve0, 18));
  console.log("Reserve1:", ethers.formatUnits(reserve1, 6));
  console.log("Pool is empty?", reserve0 === 0n && reserve1 === 0n);
  console.log();

  // Try transferring tokens DIRECTLY to pair (bypassing router)
  console.log("Step 4: Try transferring tokens directly to pair");
  const tokenAmount = ethers.parseUnits("100000", 18);
  const wveryAmount = ethers.parseUnits("100", 6);

  console.log("Transferring VLDEMO to pair...");
  const tokenTransfer = await token.transfer(POOL_ADDRESS, tokenAmount);
  await tokenTransfer.wait();
  console.log("✅ VLDEMO transferred");

  console.log("Transferring WVERY to pair...");
  const wveryTransfer = await wvery.transfer(POOL_ADDRESS, wveryAmount);
  await wveryTransfer.wait();
  console.log("✅ WVERY transferred");
  console.log();

  // Check pair balances
  console.log("Step 5: Verify pair received tokens");
  const pairVldemoBalance = await token.balanceOf(POOL_ADDRESS);
  const pairWveryBalance = await wvery.balanceOf(POOL_ADDRESS);
  console.log("Pair VLDEMO balance:", ethers.formatUnits(pairVldemoBalance, 18));
  console.log("Pair WVERY balance:", ethers.formatUnits(pairWveryBalance, 6));
  console.log();

  // Try calling mint() directly on the pair
  console.log("Step 6: Call mint() on pair");
  try {
    const mintTx = await pair.mint(signer.address);
    await mintTx.wait();
    console.log("✅ Mint succeeded!");

    const [newReserve0, newReserve1] = await pair.getReserves();
    console.log("\nNew reserves:");
    console.log("Reserve0:", ethers.formatUnits(newReserve0, 18));
    console.log("Reserve1:", ethers.formatUnits(newReserve1, 6));

    const lpBalance = await pair.balanceOf(signer.address);
    console.log("Your LP token balance:", ethers.formatUnits(lpBalance, 18));
  } catch (error: any) {
    console.log("❌ Mint failed!");
    console.log("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
