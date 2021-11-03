import { parseEther } from "@ethersproject/units";
import { formatEther } from "ethers/lib/utils";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!Boolean(process.env.FIXTURES)) {
    return;
  }
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  const signer = getSignerFrom(
    hre.config.namedAccounts.deployer as string,
    hre
  );

  await mintPOP((await deployments.get("POP")).address, signer, deployer, hre);
};

const mintPOP = async (
  address: string,
  signer: any,
  recipient: string,
  hre: HardhatRuntimeEnvironment
) => {
  const POP = await hre.ethers.getContractAt("MockERC20", address, signer);
  console.log("Minting POP for", recipient);
  await (await POP.mint(recipient, parseEther("1000000000"))).wait(1);
  console.log("Total POP supply", formatEther(await POP.totalSupply()));
};

module.exports = main;
module.exports.tags = [];
