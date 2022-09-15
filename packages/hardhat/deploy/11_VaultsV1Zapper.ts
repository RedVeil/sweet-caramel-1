import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";

import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer, crvSEth, crvZapIn, crvZapOut } = await getNamedAccounts();

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  await deploy("VaultsV1Zapper", {
    from: deployer,
    args: [(await deployments.get("ContractRegistry")).address],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  await addContractToRegistry("VaultsV1Zapper", deployments, signer, hre);

  console.log("Making VaultsV1Zapper an approved Contract");
  const aclRegistry = await hre.ethers.getContractAt(
    "ACLRegistry",
    (
      await deployments.get("ACLRegistry")
    ).address,
    signer
  );
  await aclRegistry.grantRole(ethers.utils.id("ApprovedContract"), (await deployments.get("VaultsV1Zapper")).address);

  if (["hardhat", "local"].includes(hre.network.name)) {
    console.log("Adding sEth vault");
    const vaultsV1Zapper = await ethers.getContractAt(
      "VaultsV1Zapper",
      (
        await deployments.get("VaultsV1Zapper")
      ).address
    );
    await vaultsV1Zapper.connect(signer).updateVault(crvSEth, (await deployments.get("sEthSweetVault")).address);

    console.log("Setting sEth fee");
    await vaultsV1Zapper.connect(signer).setFee(crvSEth, true, 0, 0);
  }
};
export default main;

main.dependencies = ["setup", "sweet-vaults"];
main.tags = ["core", "frontend", "zeroX-zapper"];
