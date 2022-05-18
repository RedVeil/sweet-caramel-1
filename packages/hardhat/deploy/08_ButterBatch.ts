import { BigNumber, ethers, utils } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { DeploymentsExtension } from "@anthonymartin/hardhat-deploy/dist/types";
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
    "KeeperIncentive",
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
    await keeperIncentive.createIncentive(utils.formatBytes32String("ButterBatchProcessing"), 0, false, false);

    console.log("creating incentive 2 ...");
    await keeperIncentive.createIncentive(utils.formatBytes32String("ButterBatchProcessing"), 0, false, false);
  }

  const zapperContract = await hre.ethers.getContractAt(
    "ButterBatchProcessingZapper",
    (
      await deployments.get("ButterBatchZapper")
    ).address
  );

  console.log("setting approvals for ButterBatchZapper ...");

  await zapperContract.setApprovals();

  console.log("setting ButterBatchProcessing as controller contract for keeper incentive");
  await keeperIncentive.addControllerContract(
    utils.formatBytes32String("ButterBatchProcessing"),
    (
      await deployments.get("ButterBatchProcessing")
    ).address
  );

  if (["hardhat", "local"].includes(hre.network.name)) {
    await createDemoData(hre, deployments, signer, signerAddress, deploy, addresses);
  }
};

async function createDemoData(
  hre: HardhatRuntimeEnvironment,
  deployments: DeploymentsExtension,
  signer: ethers.Signer,
  signerAddress: string,
  deploy: Function,
  addresses: any
): Promise<void> {
  console.log("creating demo data...");

  const butterBatch = await hre.ethers.getContractAt(
    "ButterBatchProcessing",
    (
      await deployments.get("ButterBatchProcessing")
    ).address,
    signer
  );

  const threeCrv = await hre.ethers.getContractAt("MockERC20", addresses.threeCrv, signer);
  const dai = await hre.ethers.getContractAt("MockERC20", addresses.dai, signer);
  const butter = await hre.ethers.getContractAt("MockERC20", addresses.butter, signer);

  //Faucet
  await deploy("Faucet", {
    from: addresses.deployer,
    args: [addresses.uniswapRouter, addresses.curveAddressProvider, addresses.curveFactoryMetapoolDepositZap],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "Faucet",
  });
  const faucet = await hre.ethers.getContractAt("Faucet", (await deployments.get("Faucet")).address, signer);

  await hre.network.provider.send("hardhat_setBalance", [
    faucet.address,
    "0x152d02c7e14af6800000", // 100k ETH
  ]);
  console.log("sending 3crv...");
  await faucet.sendThreeCrv(1000, signerAddress);
  console.log("sending dai...");
  await faucet.sendTokens(addresses.dai, 1000, signerAddress);

  await threeCrv.approve(butterBatch.address, parseEther("130000"));
  await butter.approve(butterBatch.address, parseEther("2"));

  console.log("first butter mint");
  const mintId0 = await butterBatch.currentMintBatchId();
  await butterBatch.depositForMint(parseEther("120000"), signerAddress);
  await butterBatch.batchMint();
  await butterBatch.claim(mintId0, signerAddress);

  console.log("second butter mint");
  await butterBatch.depositForMint(parseEther("10000"), signerAddress);
  await butterBatch.batchMint();

  console.log("redeeming....");
  await butterBatch.depositForRedeem(parseEther("1"));
  await butterBatch.batchRedeem();

  console.log("create batch to be redeemed");
  await butterBatch.depositForRedeem(parseEther("1"));
}

export default func;
//func.skip = async (hre: HardhatRuntimeEnvironment) => {
//  return !["mainnet", "hardhat", "local"].includes(hre.network.name);
//};
func.dependencies = ["setup"];
func.tags = ["frontend", "butter"];
