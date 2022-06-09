import { BigNumber, ethers, utils } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import SetTokenCreator from "@setprotocol/set-protocol-v2/artifacts/contracts/protocol/SetTokenCreator.sol/SetTokenCreator.json";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";
import BasicIssuanceModule from "@setprotocol/set-protocol-v2/artifacts/contracts/protocol/modules/BasicIssuanceModule.sol/BasicIssuanceModule.json";
import { DeployFunction, DeploymentsExtension } from "@anthonymartin/hardhat-deploy/types";

const SET_TOKEN_CREATOR_ADDRESS = "0xeF72D3278dC3Eba6Dc2614965308d1435FFd748a";
const SET_BASIC_ISSUANCE_MODULE_ADDRESS = "0xd8EF3cACe8b4907117a45B0b125c68560532F94D";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();
  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);
  const signerAddress = await signer.getAddress();

  const YTOKEN_ADDRESSES = [addresses.yD3, addresses.y3Eur];
  const CRV_DEPENDENCIES = [
    {
      swapPool: addresses.crvFraxMetapool,
      curveMetaPool: addresses.crvD3Metapool,
      angleRouter: ethers.constants.AddressZero,
    },
    {
      swapPool: addresses.crvEursMetapool,
      curveMetaPool: addresses.crv3EurMetapool,
      angleRouter: addresses.angleRouter,
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

  const setTokenCreator = await hre.ethers.getContractAt(SetTokenCreator.abi, SET_TOKEN_CREATOR_ADDRESS);
  const setTokenAddress = await setTokenCreator.callStatic.create(
    YTOKEN_ADDRESSES,
    [parseEther("50"), parseEther("50")],
    [addresses.setBasicIssuanceModule],
    signerAddress,
    "3X",
    "3X"
  );
  await setTokenCreator.create(
    YTOKEN_ADDRESSES,
    [parseEther("50"), parseEther("50")],
    [addresses.setBasicIssuanceModule],
    signerAddress,
    "3X",
    "3X"
  );

  const setBasicIssuanceModule = await hre.ethers.getContractAt(
    BasicIssuanceModule.abi,
    SET_BASIC_ISSUANCE_MODULE_ADDRESS
  );

  await setBasicIssuanceModule.connect(signer).initialize(setTokenAddress, hre.ethers.constants.AddressZero);

  console.log("setAddress", setTokenAddress);

  await deploy("4xStaking", {
    from: addresses.deployer,
    args: [
      (await deployments.get("TestPOP")).address,
      setTokenAddress,
      (await deployments.get("RewardsEscrow")).address,
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks,
    contract: "Staking",
  });

  //ContractRegistry
  const contractRegistryAddress = (await deployments.get("ContractRegistry")).address;

  //Butter Batch
  console.log("deploying threeXBatchProcessing...");
  await deploy("ThreeXBatchProcessing", {
    from: addresses.deployer,
    args: [
      contractRegistryAddress,
      (await deployments.get("4xStaking")).address,
      hre.ethers.constants.AddressZero,
      { sourceToken: addresses.usdc, targetToken: setTokenAddress },
      { sourceToken: setTokenAddress, targetToken: addresses.usdc },
      addresses.setBasicIssuanceModule,
      YTOKEN_ADDRESSES,
      CRV_DEPENDENCIES,
      [addresses.frax, addresses.agEur],
      { batchCooldown: BigNumber.from("1"), mintThreshold: parseEther("1"), redeemThreshold: parseEther("0.1") },
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  console.log("adding ThreeXBatchProcessing to contract registry...");
  await addContractToRegistry("ThreeXBatchProcessing", deployments, signer, hre);

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
    console.log("deploying ThreeXZapper...");
    await deploy("ThreeXZapper", {
      from: addresses.deployer,
      args: [contractRegistryAddress, addresses.threePool, [addresses.dai, addresses.usdc, addresses.usdt]],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
    await addContractToRegistry("ThreeXZapper", deployments, signer, hre);

    console.log("granting ThreeXZapper role to ThreeXZapper");
    await aclRegistry.grantRole(ethers.utils.id("ThreeXZapper"), (await deployments.get("ThreeXZapper")).address);

    console.log("granting ApprovedContract role to ThreeXZapper");
    await aclRegistry.grantRole(ethers.utils.id("ApprovedContract"), (await deployments.get("ThreeXZapper")).address);

    console.log("creating incentive 1 ...");
    await keeperIncentive.createIncentive(utils.formatBytes32String("ThreeXBatchProcessing"), 0, false, false);

    console.log("creating incentive 2 ...");
    await keeperIncentive.createIncentive(utils.formatBytes32String("ThreeXBatchProcessing"), 0, false, false);
  }

  console.log("setting ThreeXBatchProcessing as controller contract for keeper incentive");
  await keeperIncentive.addControllerContract(
    utils.formatBytes32String("ThreeXBatchProcessing"),
    (
      await deployments.get("ThreeXBatchProcessing")
    ).address
  );

  if (["hardhat", "local"].includes(hre.network.name)) {
    await createDemoData(hre, deployments, signer, signerAddress, deploy, addresses, setTokenAddress);
  }
};

async function createDemoData(
  hre: HardhatRuntimeEnvironment,
  deployments: DeploymentsExtension,
  signer: ethers.Signer,
  signerAddress: string,
  deploy: Function,
  addresses: any,
  setTokenAddress: string
): Promise<void> {
  console.log("creating demo data...");

  const threeXBatch = await hre.ethers.getContractAt(
    "ThreeXBatchProcessing",
    (
      await deployments.get("ThreeXBatchProcessing")
    ).address,
    signer
  );
  await threeXBatch.setSlippage(100, 100);

  const usdc = await hre.ethers.getContractAt("MockERC20", addresses.usdc, signer);
  const setToken = await hre.ethers.getContractAt("MockERC20", setTokenAddress, signer);

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
  console.log("sending usdc...");
  await faucet.sendTokens(addresses.usdc, 1000, signerAddress);
  console.log("sending dai...");
  await faucet.sendTokens(addresses.dai, 1000, signerAddress);
  console.log("usdcBal", await (await usdc.balanceOf(signerAddress)).toString());
  await usdc.approve(threeXBatch.address, parseEther("130000"));
  await setToken.approve(threeXBatch.address, parseEther("2"));

  console.log("first 3x mint");
  const mintId0 = await threeXBatch.currentMintBatchId();
  await threeXBatch.depositForMint(BigNumber.from("100000000000"), signerAddress); //100k usdc
  await threeXBatch.batchMint();
  await threeXBatch.claim(mintId0, signerAddress);

  console.log("second 3x mint");
  await threeXBatch.depositForMint(BigNumber.from("10000000000"), signerAddress); //10k usdc
  await threeXBatch.batchMint();

  console.log("redeeming....");
  await threeXBatch.depositForRedeem(parseEther("1"));
  await threeXBatch.batchRedeem();

  console.log("create batch to be redeemed");
  await threeXBatch.depositForRedeem(parseEther("1"));
}

export default func;

func.dependencies = ["setup"];
func.tags = ["frontend", "butter"];
