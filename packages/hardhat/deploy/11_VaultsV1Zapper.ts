import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";

import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const CURVE_ZAP_IN = "0x5Ce9b49B7A1bE9f2c3DC2B2A5BaCEA56fa21FBeE";
const CURVE_ZAP_OUT = "0xE03A338d5c305613AfC3877389DD3B0617233387";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer, crvSEth, usdt, crv3Crypto } = await getNamedAccounts();

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

  console.log("Deploying ZeroXSwapZapIn");
  await deploy("ZeroXSwapZapIn", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
  await addContractToRegistry("ZeroXSwapZapIn", deployments, signer, hre);

  console.log("Deploying ZeroXSwapZapOut");
  await deploy("ZeroXSwapZapOut", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
  await addContractToRegistry("ZeroXSwapZapOut", deployments, signer, hre);

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

    console.log((
      await deployments.get("ZeroXSwapZapIn")
    ).address,
      (
        await deployments.get("ZeroXSwapZapOut")
      ).address)

    console.log("Adding Stargate Vault");
    await vaultsV1Zapper.connect(signer).updateVault(usdt, (await deployments.get("usdtSweetVault")).address);
    await vaultsV1Zapper.connect(signer).setFee(usdt, true, 0, 0);
    await vaultsV1Zapper
      .connect(signer)
      .updateZaps(
        usdt,
        (
          await deployments.get("ZeroXSwapZapIn")
        ).address,
        (
          await deployments.get("ZeroXSwapZapOut")
        ).address
      );

    console.log("Adding 3crypto Vault");
    await vaultsV1Zapper
      .connect(signer)
      .updateVault(crv3Crypto, (await deployments.get("triCryptoSweetVault")).address);
    await vaultsV1Zapper.connect(signer).setFee(crv3Crypto, true, 0, 0);
    await vaultsV1Zapper.connect(signer).updateZaps(crv3Crypto, CURVE_ZAP_IN, CURVE_ZAP_OUT);
  }
};
export default main;

main.dependencies = ["setup", "sweet-vaults"];
main.tags = ["core", "frontend", "zeroX-zapper"];
