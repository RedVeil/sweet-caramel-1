import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const signer = getSignerFrom(
    hre.config.namedAccounts.deployer as string,
    hre
  );

  await deploy("KeeperIncentive", {
    from: deployer,
    args: [
      (await deployments.get("ContractRegistry")).address,
      BigNumber.from("0"),
      BigNumber.from("0"),
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const contractRegistry = await hre.ethers.getContractAt(
    "ContractRegistry",
    (
      await deployments.get("ContractRegistry")
    ).address,
    signer
  );
  await contractRegistry.addContract(
    ethers.utils.id("KeeperIncentive"),
    (
      await deployments.get("KeeperIncentive")
    ).address,
    ethers.utils.id("1")
  );
};
export default func;
