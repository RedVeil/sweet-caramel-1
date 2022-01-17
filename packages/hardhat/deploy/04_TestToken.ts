import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { formatEther, parseEther } from "ethers/lib/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("TestPOP", {
    from: deployer,
    args: ["Popcorn", "POP", 18],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

  //Temp solution for local deployment
  await deploy("POP_USDC_LP", {
    from: deployer,
    args: ["G-UNI USDC/POP LP", "G-UNI", 18],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

  const signer = await getSignerFrom(
    hre.config.namedAccounts.deployer as string,
    hre
  );

  await mintPOP(
    (
      await deployments.get("TestPOP")
    ).address,
    signer,
    hre.config.namedAccounts.deployer as string,
    hre
  );
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
export default main;
main.dependencies = ["setup"];
main.tags = ["LBP", "frontend", "test-tokens"];
