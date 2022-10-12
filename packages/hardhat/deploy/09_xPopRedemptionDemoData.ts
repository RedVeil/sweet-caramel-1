import { formatEther, parseEther } from "ethers/lib/utils";
import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  if (["hardhat", "local", "localhost"].includes(hre.network.name)) {
    await mintPOP(
      (
        await deployments.get("XPop")
      ).address,
      signer,
      await signer.getAddress(),
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

const mintPOP = async (address: string, signer: any, recipient: string, hre: HardhatRuntimeEnvironment) => {
  const POP = await hre.ethers.getContractAt("MockERC20", address, signer);
  console.log(`Minting ${await POP.symbol()} for`, recipient);
  await (await POP.mint(recipient, parseEther("1000000000"))).wait(1);
  console.log("Total POP supply", formatEther(await POP.totalSupply()));
};

module.exports = main;
export default main;
main.dependencies = ["setup", "xpop-redemption"];
main.tags = ["frontend", "xpop-redemption-demo-data"];
