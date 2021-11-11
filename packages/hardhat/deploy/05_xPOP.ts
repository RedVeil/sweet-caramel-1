import { BigNumber } from "@ethersproject/bignumber";
import { formatEther, parseEther } from "@ethersproject/units";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { XPop } from "../typechain";

const XPOP_SUPPLY = parseEther("1000000");

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer, DAO_Agent } = await getNamedAccounts();

  await deploy("xPOP", {
    from: deployer,
    args: [XPOP_SUPPLY],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks,
    contract: "XPop",
  });

  const signer = getSignerFrom(
    hre.config.namedAccounts.deployer as string,
    hre
  );

  const deployment = await deployments.get("xPOP");
  const xPop = await connect(deployment.address, signer, hre);
  await mint(xPop, DAO_Agent, XPOP_SUPPLY);
  await transferOwner(xPop, DAO_Agent);
};

async function connect(
  tokenAddress: string,
  signer: any,
  hre: HardhatRuntimeEnvironment
): Promise<XPop> {
  return await hre.ethers.getContractAt("XPop", tokenAddress, signer);
}

async function mint(xpop: XPop, recipient: string, supply: BigNumber) {
  console.log("Minting", formatEther(supply), "xPOP to", recipient);
  return await xpop.mint(recipient, supply);
}

async function transferOwner(xpop: XPop, newOwner: string) {
  console.log("Transferring ownership to", newOwner);
  return await xpop.transferOwnership(newOwner);
}

module.exports = main;
module.exports.tags = ["xpop"];
module.exports.dependencies = ["setup"];
