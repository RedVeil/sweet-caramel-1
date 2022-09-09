import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";
import { ethers } from "hardhat";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer, crvSEth } = await getNamedAccounts();

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  await deploy("ZeroXZapper", {
    from: deployer,
    args: [(await deployments.get("ContractRegistry")).address],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  await addContractToRegistry("ZeroXZapper", deployments, signer, hre);

  console.log("Making ZeroXZapper an approved Contract");
  const aclRegistry = await hre.ethers.getContractAt(
    "ACLRegistry",
    (
      await deployments.get("ACLRegistry")
    ).address,
    signer
  );
  await aclRegistry.grantRole(ethers.utils.id("ApprovedContract"), (await deployments.get("ZeroXZapper")).address);

  if (["hardhat", "local"].includes(hre.network.name)) {
    console.log("Adding sEth vault");
    const zeroXZapper = await ethers.getContractAt("ZeroXZapper", (await deployments.get("ZeroXZapper")).address);
    await zeroXZapper.connect(signer).updateVault(crvSEth, (await deployments.get("sEthSweetVault")).address);

    console.log("Setting sEth fee");
    await zeroXZapper.connect(signer).setFee(crvSEth, true, 0, 0);
  }
};
export default main;

main.dependencies = ["setup", "sweet-vaults"];
main.tags = ["core", "frontend", "zeroX-zapper"];
