import { DeploymentsExtension } from "@anthonymartin/hardhat-deploy/dist/types";
import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { BigNumber, ethers, utils } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();
  const signer = getSignerFrom(
    hre.config.namedAccounts.deployer as string,
    hre
  );
  const signerAddress = await signer.getAddress();

  const YTOKEN_ADDRESSES = [
    addresses.yDusd,
    addresses.yFrax,
    addresses.yUsdn,
    addresses.yUst,
  ];
  const CRV_DEPENDENCIES = [
    {
      curveMetaPool: addresses.dusdMetapool,
      crvLPToken: addresses.crvDusd,
    },
    {
      curveMetaPool: addresses.fraxMetapool,
      crvLPToken: addresses.crvFrax,
    },
    {
      curveMetaPool: addresses.usdnMetapool,
      crvLPToken: addresses.crvUsdn,
    },
    {
      curveMetaPool: addresses.ustMetapool,
      crvLPToken: addresses.crvUst,
    },
  ];

  //ContractRegistry
  const contractRegistryAddress = (await deployments.get("ContractRegistry"))
    .address;
  const contractRegistry = await hre.ethers.getContractAt(
    "ContractRegistry",
    contractRegistryAddress,
    signer
  );

  //Butter Batch
  console.log("deploying butterBatch...");
  await deploy("ButterBatch", {
    from: addresses.deployer,
    args: [
      contractRegistryAddress,
      addresses.butter,
      addresses.threeCrv,
      addresses.setBasicIssuanceModule,
      YTOKEN_ADDRESSES,
      CRV_DEPENDENCIES,
      1,
      parseEther("1"),
      parseEther("0.1"),
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "HysiBatchInteraction",
  });
  console.log("adding butterBatch to contract registry...");
  await contractRegistry.addContract(
    ethers.utils.id("HysiBatchInteraction"),
    (
      await deployments.get("ButterBatch")
    ).address,
    ethers.utils.id("1")
  );

  //Butter Batch Zapper
  console.log("deploying butterBatchZapper...");
  await deploy("ButterBatchZapper", {
    from: addresses.deployer,
    args: [contractRegistryAddress, addresses.threePool, addresses.threeCrv],
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

  //Adding permissions and other maintance
  const keeperIncentive = await hre.ethers.getContractAt(
    "KeeperIncentive",
    (
      await deployments.get("KeeperIncentive")
    ).address,
    signer
  );

  await keeperIncentive.createIncentive(
    utils.formatBytes32String("HysiBatchInteraction"),
    0,
    false,
    true
  );
  await keeperIncentive.createIncentive(
    utils.formatBytes32String("HysiBatchInteraction"),
    0,
    false,
    true
  );

  await keeperIncentive.addControllerContract(
    utils.formatBytes32String("HysiBatchInteraction"),
    (
      await deployments.get("ButterBatch")
    ).address
  );

  const aclRegistry = await hre.ethers.getContractAt(
    "ACLRegistry",
    (
      await deployments.get("ACLRegistry")
    ).address,
    signer
  );
  await aclRegistry.grantRole(
    ethers.utils.id("HysiZapper"),
    (
      await deployments.get("ButterBatchZapper")
    ).address
  );

  if (["hardhat", "local"].includes(hre.network.name)) {
    createDemoData(hre, deployments, signer, signerAddress, deploy, addresses);
  }
};
export default func;

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
    "HysiBatchInteraction",
    (
      await deployments.get("ButterBatch")
    ).address,
    signer
  );

  const threeCrv = await hre.ethers.getContractAt(
    "MockERC20",
    addresses.threeCrv,
    signer
  );
  const dai = await hre.ethers.getContractAt(
    "MockERC20",
    addresses.dai,
    signer
  );
  const butter = await hre.ethers.getContractAt(
    "MockERC20",
    addresses.butter,
    signer
  );

  //Faucet
  await deploy("Faucet", {
    from: addresses.deployer,
    args: [
      addresses.uniswapRouter,
      addresses.curveAddressProvider,
      addresses.curveFactoryMetapoolDepositZap,
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "Faucet",
  });
  const faucet = await hre.ethers.getContractAt(
    "Faucet",
    (
      await deployments.get("Faucet")
    ).address,
    signer
  );

  await hre.network.provider.send("hardhat_setBalance", [
    faucet.address,
    "0x152d02c7e14af6800000", // 100k ETH
  ]);
  console.log("sending 3crv...");
  await faucet.sendThreeCrv(1000, signerAddress);
  console.log("sending dai...");
  await faucet.sendTokens(addresses.dai, 1000, signerAddress);

  await threeCrv.approve(butterBatch.address, parseEther("1000000000000"));
  await dai.approve(butterBatch.address, parseEther("1000000000000"));
  await butter.approve(butterBatch.address, parseEther("1000000000000"));

  console.log("first butter mint");
  const mintId0 = await butterBatch.currentMintBatchId();
  await butterBatch.depositForMint(parseEther("1200"), signerAddress);
  await butterBatch.batchMint(BigNumber.from("0"));
  await butterBatch.claim(mintId0, signerAddress);
  console.log("second butter mint");
  await butterBatch.depositForMint(parseEther("550"), signerAddress);
  await butterBatch.batchMint(BigNumber.from("0"));
  console.log("redeeming....");
  await butterBatch.depositForRedeem(parseEther("1.5"));
  await butterBatch.batchRedeem(BigNumber.from("0"));
  console.log("create batch to be batched");
  //await butterBatch.depositForMint(parseEther("600"), signerAddress);
  await butterBatch.depositForRedeem(parseEther("1.5"));
}
