import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
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
    POP,
    DAO_Treasury,
  } = await getNamedAccounts();

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
    pre_eip1559: supportsEIP1559(hre),
    gasLimit: 2500000,
    // gasPrice: parseUnits("150", "gwei"),
  });

  console.log("Now, please send POP and USDC to ", deployed.address);

  // act/0x6d8bd5d37461788182131bae19d03ff2b3c0687c/0x649D645d1Ee2CA89a798B52Bbf7B5a3C27093b94/approve(address: 0xB84fed0Aa42A28E9F27E080eb0744Af44D9B7868, uint256: 1000000000000000000000000000)

  console.log("--------------------------------");
  console.log(`act/${DAO_Agent}/${deployed.address}/deployLBP()`);
};
export default func;
func.dependencies = ["setup"];
func.tags = ["LBP"];
const supportsEIP1559 = (hre: HardhatRuntimeEnvironment): boolean => {
  const NOT_EIP1559Compatible = [
    "rinkarby",
    "mumbai",
    "polygon",
    "polygontest",
    "arbitrum",
  ];
  return !NOT_EIP1559Compatible.includes(hre.network.name);
};
