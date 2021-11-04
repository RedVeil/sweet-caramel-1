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
  } = await getConstructorArgs(
    {
      BalancerLBPFactory,
      BalancerVault,
      USDC,
      POP,
      DAO_Agent,
      DAO_Treasury,
      deployer,
    },
    hre
  );

  const deployed = await deploy("LBPManager", {
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

  console.log(
    "These addresses need to approve",
    deployed.address,
    "for spending:",
    {
      POP: tokens[0],
      USDC: tokens[1],
    }
  );
  // act/0x6d8bd5d37461788182131bae19d03ff2b3c0687c/0x649D645d1Ee2CA89a798B52Bbf7B5a3C27093b94/approve(address: 0xB84fed0Aa42A28E9F27E080eb0744Af44D9B7868, uint256: 1000000000000000000000000000)
  console.log(
    `act/${DAO_Agent}/${tokens[0]}/approve(address: ${deployed.address}, uint256: 1000000000000000000000000000)`
  );
  console.log(
    `act/${DAO_Agent}/${tokens[1]}/approve(address: ${deployed.address}, uint256: 1000000000000000000000000000)`
  );
  console.log(`act/${DAO_Agent}/${deployed.address}/deployLBP()`);
};
export default func;
func.tags = ["LBP"];
