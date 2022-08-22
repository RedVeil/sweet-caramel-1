import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";

import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();
  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  const contractRegistry = await deployments.get("ContractRegistry");

  const PREFERRED_STABLECOIN_INDEX = 1; // Index of USDC in 3Pool
  const KEEPER_TIP = 500; // Keeper tip in BPS

  console.log("Deploying ButterFeeConverter...");
  await deploy("ButterFeeConverter", {
    from: addresses.deployer,
    args: [
      addresses.butter,
      addresses.setStreamingFeeModule,
      contractRegistry.address,
      addresses.threePool,
      addresses.threeCrv,
      PREFERRED_STABLECOIN_INDEX,
      KEEPER_TIP,
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "ButterFeeConverter",
  });
  const butterFeeConverterDeployment = await deployments.get("ButterFeeConverter");

  console.log("Creating keeper incentive...");
  const keeperIncentiveDeployment = await deployments.get("KeeperIncentive");
  const keeperIncentive = await hre.ethers.getContractAt("KeeperIncentiveV2", keeperIncentiveDeployment.address);
  await keeperIncentive.createIncentive(butterFeeConverterDeployment.address, 0, true, true, addresses.threeCrv, 1, 0);

  console.log("Adding ButterFeeConverter to contract registry...");
  await addContractToRegistry("ButterFeeConverter", deployments, signer, hre);

  console.log("ButterFeeConverter deployment complete.");
};

export default func;

func.dependencies = ["setup"];
func.tags = ["core", "butter"];
