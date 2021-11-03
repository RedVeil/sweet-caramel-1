import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getConstructorArgs } from "./LBP/config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const {
    deployer,
    USDC,
    BalancerLBPFactory,
    BalancerVault,
    DAO_Agent,
    DAO_Treasury,
  } = await getNamedAccounts();

  const POP = (await hre.deployments.get("POP")).address;

  const {
    balancer,
    name,
    symbol,
    tokens,
    tokenAmounts,
    startWeights,
    endWeights,
    swapFee,
    durationInSeconds,
    startTime,
    dao,
  } = getConstructorArgs(
    {
      BalancerLBPFactory,
      BalancerVault,
      USDC,
      POP,
      DAO_Agent,
      DAO_Treasury,
      deployer,
    },
    hre.network.name
  );

  await deploy("LBPManager", {
    from: deployer,
    args: [
      balancer,
      name,
      symbol,
      tokens,
      tokenAmounts,
      startWeights,
      endWeights,
      swapFee,
      durationInSeconds,
      startTime,
      dao,
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};
export default func;
module.exports.tags = ["lbp"];
