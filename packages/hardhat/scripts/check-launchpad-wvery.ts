import { ethers } from "hardhat";

async function main() {
  const LAUNCHPAD_PROXY = "0x09635F643e140090A9A8Dcd712eD6285858ceBef";
  const EXPECTED_WVERY = "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f";

  const launchpad = await ethers.getContractAt("Launchpad", LAUNCHPAD_PROXY);
  const wveryAddr = await launchpad.usdcToken();

  console.log("Launchpad's WVERY address:", wveryAddr);
  console.log("Expected (from deployment):", EXPECTED_WVERY);

  if (wveryAddr.toLowerCase() === EXPECTED_WVERY.toLowerCase()) {
    console.log("✅ Launchpad is using the correct WVERY address");
  } else {
    console.log("❌ LAUNCHPAD IS USING OLD WVERY ADDRESS!");
    console.log("This is why pools are created with the wrong WVERY token");
    console.log("\nThe Launchpad proxy state wasn't reset during redeployment.");
    console.log("The proxy implementation was updated but the storage (including the WVERY address) persisted.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
