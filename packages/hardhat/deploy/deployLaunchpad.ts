import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployLaunchpad: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Get current deployed contract addresses
  const wveryDeployment = await hre.deployments.get("WrappedVery");
  const routerDeployment = await hre.deployments.get("BumdexRouter");
  const factoryDeployment = await hre.deployments.get("BumdexFactory");

  await deploy("Launchpad", {
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [
            deployer, // campaign staking contract address (using deployer for now)
            wveryDeployment.address,
            routerDeployment.address,
            factoryDeployment.address,
            50 * 10 ** 6, // promotion fee (50 WVERY with 6 decimals)
          ],
        },
      },
    },
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  await hre.ethers.getContract<Contract>("Launchpad", deployer);
};

export default deployLaunchpad;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployLaunchpad.tags = ["Launchpad"];
deployLaunchpad.dependencies = ["WrappedVery", "BumdexRouter", "BumdexFactory"];
