import { ethers } from "hardhat";

const LAUNCHPAD_ADDRESS = "0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf";
const WVERY_ADDRESS = "0x998abeb3E57409262aE5b751f60747921B33613E";

async function main() {
  const [signer] = await ethers.getSigners();

  console.log("\n🧪 Testing buyTokens Function\n");
  console.log("Buyer address:", signer.address);

  const launchpad = await ethers.getContractAt("Launchpad", LAUNCHPAD_ADDRESS);
  const wvery = await ethers.getContractAt("WrappedVery", WVERY_ADDRESS);

  // Check balances
  const wveryBalance = await wvery.balanceOf(signer.address);
  console.log("WVERY Balance:", ethers.formatUnits(wveryBalance, 6), "WVERY");

  // Approve WVERY
  const approveAmount = ethers.parseUnits("1000", 6); // Approve 1000 WVERY
  console.log("\n📝 Approving", ethers.formatUnits(approveAmount, 6), "WVERY...");
  const approveTx = await wvery.approve(LAUNCHPAD_ADDRESS, approveAmount);
  await approveTx.wait();
  console.log("✅ Approval confirmed");

  // Check allowance
  const allowance = await wvery.allowance(signer.address, LAUNCHPAD_ADDRESS);
  console.log("WVERY Allowance:", ethers.formatUnits(allowance, 6), "WVERY");

  // Buy tokens
  const buyAmount = ethers.parseUnits("100", 6); // Buy with 100 WVERY
  console.log("\n💰 Buying tokens with", ethers.formatUnits(buyAmount, 6), "WVERY...");

  const buyTx = await launchpad.buyTokens(1, buyAmount);
  console.log("Transaction hash:", buyTx.hash);

  const receipt = await buyTx.wait();
  console.log("✅ Purchase confirmed!");
  console.log("Gas used:", receipt?.gasUsed.toString());

  // Check campaign status
  const campaign = await launchpad.campaigns(1);
  console.log("\n📊 Campaign Status:");
  console.log("Amount Raised:", ethers.formatUnits(campaign.amountRaised, 6), "WVERY");
  console.log("Tokens Sold:", ethers.formatUnits(campaign.tokensSold, 18));

  // Check token balance
  const tokenAddress = campaign.token;
  const token = await ethers.getContractAt("TokenFacet", tokenAddress);
  const tokenBalance = await token.balanceOf(signer.address);
  console.log("Your Token Balance:", ethers.formatUnits(tokenBalance, 18), campaign.symbol);

  console.log("\n✅ All tests passed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
