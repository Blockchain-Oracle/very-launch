import { ethers } from "hardhat";

const ROUTER_ADDRESS = "0x9d4454B023096f34B160D6B654540c56A1F81688";
const WVERY_ADDRESS = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
const VLDEMO_TOKEN_ADDRESS = "0x94B9874aC5605713CcAc00ca8E832B37e15c1399";

async function main() {
  const [signer] = await ethers.getSigners();

  console.log("=== Testing Router AddLiquidity Directly ===\n");
  console.log("Signer:", signer.address);

  const routerAbi = [
    "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)"
  ];
  const router = await ethers.getContractAt(routerAbi, ROUTER_ADDRESS);

  const wvery = await ethers.getContractAt("WrappedVery", WVERY_ADDRESS);
  const tokenAbi = ["function balanceOf(address) view returns (uint256)", "function approve(address, uint256) returns (bool)"];
  const token = await ethers.getContractAt(tokenAbi, VLDEMO_TOKEN_ADDRESS);

  // Match pool's existing 5:1 ratio (5 VLDEMO per 1 WVERY)
  const wveryAmount = ethers.parseUnits("100", 6);
  const tokenAmount = ethers.parseUnits("500", 18); // 500 VLDEMO (5:1 ratio)
  const minWveryLiquidity = (wveryAmount * 98n) / 100n;
  const minTokenLiquidity = (tokenAmount * 98n) / 100n;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

  console.log("Amounts:");
  console.log("  WVERY:", ethers.formatUnits(wveryAmount, 6));
  console.log("  VLDEMO:", ethers.formatUnits(tokenAmount, 18));
  console.log();

  // Check balances
  const wveryBalance = await wvery.balanceOf(signer.address);
  const tokenBalance = await token.balanceOf(signer.address);

  console.log("Balances:");
  console.log("  WVERY:", ethers.formatUnits(wveryBalance, 6));
  console.log("  VLDEMO:", ethers.formatUnits(tokenBalance, 18));
  console.log();

  // Approve router
  console.log("Approving router for WVERY...");
  const wveryApproveTx = await wvery.approve(ROUTER_ADDRESS, wveryAmount);
  await wveryApproveTx.wait();
  console.log("✅ WVERY approved");

  console.log("Approving router for VLDEMO...");
  const tokenApproveTx = await token.approve(ROUTER_ADDRESS, tokenAmount);
  await tokenApproveTx.wait();
  console.log("✅ VLDEMO approved");
  console.log();

  // Try addLiquidity
  console.log("Calling router.addLiquidity...");
  console.log("Parameters:");
  console.log("  tokenA:", VLDEMO_TOKEN_ADDRESS);
  console.log("  tokenB:", WVERY_ADDRESS);
  console.log("  amountADesired:", tokenAmount.toString());
  console.log("  amountBDesired:", wveryAmount.toString());
  console.log("  amountAMin:", minTokenLiquidity.toString());
  console.log("  amountBMin:", minWveryLiquidity.toString());
  console.log("  to:", signer.address);
  console.log("  deadline:", deadline.toString());
  console.log();

  try {
    const tx = await router.addLiquidity(
      VLDEMO_TOKEN_ADDRESS,
      WVERY_ADDRESS,
      tokenAmount,
      wveryAmount,
      minTokenLiquidity,
      minWveryLiquidity,
      signer.address,
      deadline
    );

    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ AddLiquidity succeeded!");
    console.log("Gas used:", receipt.gasUsed.toString());
  } catch (error: any) {
    console.error("❌ AddLiquidity failed!");
    console.error("Error:", error.message);

    if (error.data) {
      console.error("Error data:", error.data);
    }

    // Try to decode the error
    try {
      const errorData = error.data;
      if (errorData) {
        // Common error selectors
        const errors: Record<string, string> = {
          "0x": "No error message",
          "0x08c379a0": "Error(string)", // Standard revert
        };

        for (const [selector, name] of Object.entries(errors)) {
          if (errorData.startsWith(selector)) {
            console.error("Error type:", name);
            break;
          }
        }

        // Try to parse as string
        if (errorData.startsWith("0x08c379a0")) {
          try {
            const reason = ethers.AbiCoder.defaultAbiCoder().decode(["string"], "0x" + errorData.slice(10));
            console.error("Revert reason:", reason[0]);
          } catch (e) {
            console.error("Could not decode error string");
          }
        }
      }
    } catch (e) {
      console.error("Could not decode error");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
