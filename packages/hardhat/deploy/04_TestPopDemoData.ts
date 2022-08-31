import { formatEther, parseEther } from "ethers/lib/utils";
import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  await mintPOP((await deployments.get("TestPOP")).address, signer, hre.config.namedAccounts.deployer as string, hre);
};

const mintPOP = async (address: string, signer: any, recipient: string, hre: HardhatRuntimeEnvironment) => {
  const POP = await hre.ethers.getContractAt("MockERC20", address, signer);
  console.log(`Minting ${await POP.symbol()} for`, recipient, "at ", address);
  await (await POP.mint(recipient, parseEther("1000000000"))).wait(1);
  console.log("Total POP supply", formatEther(await POP.totalSupply()));
};

module.exports = main;
export default main;
main.dependencies = ["setup", "test-pop"];
main.tags = ["LBP", "frontend", "mint-pop"];
