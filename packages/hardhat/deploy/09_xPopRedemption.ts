import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { formatEther, parseEther } from "ethers/lib/utils";
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
      isMainnet ? xPop : (await deployments.get("TestXPop")).address,
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

  if (["hardhat", "local"].includes(hre.network.name)) {
    await mintPOP(
      (
        await deployments.get("TestXPop")
      ).address,
      signer,
      hre.config.namedAccounts.deployer as string,
      hre
    );
    await mintPOP(
      (
        await deployments.get("TestPOP")
      ).address,
      signer,
      (
        await deployments.get("xPopRedemption")
      ).address,
      hre
    );
  }
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

const mintPOP = async (address: string, signer: any, recipient: string, hre: HardhatRuntimeEnvironment) => {
  const POP = await hre.ethers.getContractAt("MockERC20", address, signer);
  console.log("Minting POP for", recipient);
  await (await POP.mint(recipient, parseEther("1000000000"))).wait(1);
  console.log("Total POP supply", formatEther(await POP.totalSupply()));
};

module.exports = main;
export default main;
main.dependencies = ["setup", "rewards-escrow", "x-pop"];
main.tags = ["frontend", "xpop-redemption"];
