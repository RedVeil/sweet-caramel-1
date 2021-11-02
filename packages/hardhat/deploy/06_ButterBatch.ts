import { parseEther } from "@ethersproject/units";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const signer = await getSignerFrom(
    hre.config.namedAccounts.deployer as string,
    hre
  );

  const contractRegistryAddress = (await deployments.get("ContractRegistry"))
    .address;
  const contractRegistry = await hre.ethers.getContractAt(
    "ContractRegistry",
    contractRegistryAddress,
    signer
  );
  const threeCrvAddress = (await deployments.get("ContractRegistry")).address;

  await deploy("ButterBatch", {
    from: deployer,
    args: [
      contractRegistryAddress,
      (await deployments.get("BUTTER")).address,
      threeCrvAddress,
      contractRegistryAddress,
      //(await deployments.get("BasicIssuanceModule")).address,
      [
        (await deployments.get("yVault1")).address,
        (await deployments.get("yVault2")).address,
      ],
      [
        {
          curveMetaPool: contractRegistryAddress, //(await deployments.get("CurveMetapool1")).address,
          crvLPToken: (await deployments.get("crvLP1")).address,
        },
        {
          curveMetaPool: contractRegistryAddress, //(await deployments.get("CurveMetapool2")).address,
          crvLPToken: (await deployments.get("crvLP2")).address,
        },
      ],
      60 * 60 * 24,
      parseEther("100"),
      parseEther("1"),
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "HysiBatchInteraction",
  });

  await contractRegistry.addContract(
    ethers.utils.id("HysiBatchInteraction"),
    (
      await deployments.get("ButterBatch")
    ).address,
    ethers.utils.id("1")
  );

  await deploy("ButterBatchZapper", {
    from: deployer,
    args: [
      contractRegistryAddress,
      contractRegistryAddress,
      //(await deployments.get("CurveThreePool")).address,
      threeCrvAddress,
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "HysiBatchZapper",
  });

  await contractRegistry.addContract(
    ethers.utils.id("HysiBatchZapper"),
    (
      await deployments.get("ButterBatchZapper")
    ).address,
    ethers.utils.id("1")
  );
};
export default func;
