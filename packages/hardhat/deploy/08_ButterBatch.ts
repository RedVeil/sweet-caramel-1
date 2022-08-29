import { BigNumber, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();
  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);
  const signerAddress = await signer.getAddress();
  const pop = addresses.pop;

  const YTOKEN_ADDRESSES = [addresses.yFrax, addresses.yRai, addresses.yMusd, addresses.yAlusd];
  const CRV_DEPENDENCIES = [
    {
      curveMetaPool: addresses.crvFraxMetapool,
      crvLPToken: addresses.crvFrax,
    },
    {
      curveMetaPool: addresses.crvRaiMetapool,
      crvLPToken: addresses.crvRai,
    },
    {
      curveMetaPool: addresses.crvMusdMetapool,
      crvLPToken: addresses.crvMusd,
    },
    {
      curveMetaPool: addresses.crvAlusdMetapool,
      crvLPToken: addresses.crvAlusd,
    },
  ];

  console.log(
    JSON.stringify(
      {
        YTOKEN_ADDRESSES,
        CRV_DEPENDENCIES,
      },
      null,
      2
    )
  );

  //ContractRegistry
  const contractRegistryAddress = (await deployments.get("ContractRegistry")).address;

  //Butter Batch
  console.log("deploying butterBatch...");
  const deployed = await deploy("ButterBatchProcessing", {
    from: addresses.deployer,
    args: [
      contractRegistryAddress,
      addresses.butterStaking,
      addresses.butter,
      addresses.threeCrv,
      addresses.threePool,
      addresses.setBasicIssuanceModule,
      YTOKEN_ADDRESSES,
      CRV_DEPENDENCIES,
      { batchCooldown: BigNumber.from("1"), mintThreshold: parseEther("1"), redeemThreshold: parseEther("0.1") },
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "ButterBatchProcessing",
  });

  console.log("adding butterBatch to contract registry...");
  await addContractToRegistry("ButterBatchProcessing", deployments, signer, hre);

  console.log("setting approvals for ButterBatchProcessing");
  const butterBatchProcessing = await hre.ethers.getContractAt(
    "ButterBatchProcessing",
    (
      await deployments.get("ButterBatchProcessing")
    ).address
  );
  await butterBatchProcessing.setApprovals();

  //Adding permissions and other maintance
  const keeperIncentive = await hre.ethers.getContractAt(
    "KeeperIncentiveV2",
    (
      await deployments.get("KeeperIncentive")
    ).address,
    signer
  );

  const aclRegistry = await hre.ethers.getContractAt(
    "ACLRegistry",
    (
      await deployments.get("ACLRegistry")
    ).address,
    signer
  );
  if (!Boolean(parseInt(process.env.UPDATE_ONLY || "0"))) {
    //Butter Batch Zapper
    console.log("deploying butterBatchZapper...");
    await deploy("ButterBatchZapper", {
      from: addresses.deployer,
      args: [contractRegistryAddress, addresses.threePool, addresses.threeCrv],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      contract: "ButterBatchProcessingZapper",
    });
    await addContractToRegistry("ButterBatchZapper", deployments, signer, hre);

    console.log("granting ButterZapper role to ButterBatchZapper");
    await aclRegistry.grantRole(ethers.utils.id("ButterZapper"), (await deployments.get("ButterBatchZapper")).address);

    console.log("granting ApprovedContract role to ButterBatchZapper");
    await aclRegistry.grantRole(
      ethers.utils.id("ApprovedContract"),
      (
        await deployments.get("ButterBatchZapper")
      ).address
    );

    console.log("creating incentive 1 ...");
    await keeperIncentive.createIncentive(butterBatchProcessing.address, 0, true, true, pop, 60 * 60 * 24, 0);

    console.log("creating incentive 2 ...");
    await keeperIncentive.createIncentive(butterBatchProcessing.address, 0, true, true, pop, 60 * 60 * 24, 0);
  }

  const zapperContract = await hre.ethers.getContractAt(
    "ButterBatchProcessingZapper",
    (
      await deployments.get("ButterBatchZapper")
    ).address
  );

  console.log("setting approvals for ButterBatchZapper ...");

  await zapperContract.setApprovals();
};

export default func;

func.dependencies = ["setup", "acl-registry", "contract-registry", "keeper-incentives"];
func.tags = ["frontend", "butter"];
