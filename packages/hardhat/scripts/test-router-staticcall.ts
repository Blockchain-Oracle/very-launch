import { ethers } from "hardhat";

const ROUTER_ADDRESS = "0x9d4454B023096f34B160D6B654540c56A1F81688";
const WVERY_ADDRESS = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
const VLDEMO_TOKEN_ADDRESS = "0x94B9874aC5605713CcAc00ca8E832B37e15c1399";

async function main() {
  const [signer] = await ethers.getSigners();

  console.log("=== Testing Router with Static Call ===\n");

  const routerAbi = [
    "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)"
  ];
  const router = await ethers.getContractAt(routerAbi, ROUTER_ADDRESS);

  const wvery = await ethers.getContractAt("WrappedVery", WVERY_ADDRESS);
  const tokenAbi = ["function balanceOf(address) view returns (uint256)", "function approve(address, uint256) returns (bool)", "function allowance(address, address) view returns (uint256)"];
  const token = await ethers.getContractAt(tokenAbi, VLDEMO_TOKEN_ADDRESS);

  const wveryAmount = ethers.parseUnits("100", 6);
  const tokenAmount = ethers.parseUnits("500", 18);
  const minWveryLiquidity = (wveryAmount * 98n) / 100n;
  const minTokenLiquidity = (tokenAmount * 98n) / 100n;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

  // Approve first
  console.log("Approving tokens...");
  await (await wvery.approve(ROUTER_ADDRESS, wveryAmount)).wait();
  await (await token.approve(ROUTER_ADDRESS, tokenAmount)).wait();
  console.log("✅ Approved\n");

  // Check allowances
  const wveryAllowance = await wvery.allowance(signer.address, ROUTER_ADDRESS);
  const tokenAllowance = await token.allowance(signer.address, ROUTER_ADDRESS);
  console.log("Allowances:");
  console.log("  WVERY:", ethers.formatUnits(wveryAllowance, 6));
  console.log("  VLDEMO:", ethers.formatUnits(tokenAllowance, 18));
  console.log();

  // Try static call
  console.log("Trying static call...");
  try {
    const result = await router.addLiquidity.staticCall(
      VLDEMO_TOKEN_ADDRESS,
      WVERY_ADDRESS,
      tokenAmount,
      wveryAmount,
      minTokenLiquidity,
      minWveryLiquidity,
      signer.address,
      deadline
    );
    console.log("✅ Static call succeeded!");
    console.log("  amountA:", ethers.formatUnits(result[0], 18));
    console.log("  amountB:", ethers.formatUnits(result[1], 6));
    console.log("  liquidity:", ethers.formatUnits(result[2], 18));
  } catch (error: any) {
    console.log("❌ Static call failed!");
    console.log("Error:", error.message);
    
    // Try to extract revert reason
    if (error.data) {
      console.log("Error data:", error.data);
      
      // Try to decode common errors
      try {
        const iface = new ethers.Interface([
          "error EXPIRED()",
          "error PAIR_DOES_NOT_EXIST()",
          "error INSUFFICIENT_LIQUIDITY()",
          "error INSUFFICIENT_AMOUNT()",
          "error INSUFFICIENT_A_AMOUNT()",
          "error INSUFFICIENT_B_AMOUNT()",
          "error TRANSFER_FROM_FAILED()"
        ]);
        const decoded = iface.parseError(error.data);
        if (decoded) {
          console.log("Decoded error:", decoded.name);
        }
      } catch (e) {
        // Try string decode
        if (error.data.startsWith("0x08c379a0")) {
          try {
            const reason = ethers.AbiCoder.defaultAbiCoder().decode(["string"], "0x" + error.data.slice(10));
            console.log("Revert reason:", reason[0]);
          } catch (e) {
            console.log("Could not decode error string");
          }
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
