import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { addContractToRegistry, getSetup } from "./utils";

const CURVE_ZAP_IN = "0x5Ce9b49B7A1bE9f2c3DC2B2A5BaCEA56fa21FBeE";
const CURVE_ZAP_OUT = "0xE03A338d5c305613AfC3877389DD3B0617233387";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy, deployments, addresses, signer } = await getSetup(hre);
  const { deployer, crvSEth, crvZapIn, crvZapOut } = addresses;

  await deploy("VaultsV1Zapper", {
    from: await signer.getAddress(),
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

    console.log("Setting sEth zaps");
    await vaultsV1Zapper.connect(signer).updateZaps(crvSEth, CURVE_ZAP_IN, CURVE_ZAP_OUT);
  }
};
export default main;

main.dependencies = ["setup", "sweet-vaults"];
main.tags = ["core", "frontend", "zeroX-zapper"];
