import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer, pop, xPop } = await getNamedAccounts();
  const isMainnet = ["mainnet", "polygon", "arbitrum", "bsc"].includes(hre.network.name);

  await deploy("xPopRedemption", {
    from: deployer,
    args: [
      isMainnet ? xPop : (await deployments.get("XPop")).address,
      isMainnet ? pop : (await deployments.get("TestPOP")).address,
      (await deployments.get("RewardsEscrow")).address,
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks

    contract: "XPopRedemption",
  });

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  await authorizeXPopRedemption((await deployments.get("RewardsEscrow")).address, signer, hre);
  await approveRewardsEscrow((await deployments.get("xPopRedemption")).address, signer, hre);
};

async function authorizeXPopRedemption(address: string, signer: any, hre: HardhatRuntimeEnvironment) {
  console.log("authorizing xPop redemption contract to interact with Rewards Escrow ...");
  const rewardsEscrow = await hre.ethers.getContractAt("RewardsEscrow", address, signer);
  await rewardsEscrow.addAuthorizedContract((await hre.deployments.get("xPopRedemption")).address);
}

async function approveRewardsEscrow(address: string, signer: any, hre: HardhatRuntimeEnvironment) {
  console.log("setting approvals for xpop redemption ...");
  const xPopRedemption = await hre.ethers.getContractAt("XPopRedemption", address, signer);
  await xPopRedemption.setApprovals();
}

module.exports = main;
export default main;
main.dependencies = ["setup", "xpop", "rewards-escrow", "test-pop"];
main.tags = ["frontend", "xpop-redemption"];
