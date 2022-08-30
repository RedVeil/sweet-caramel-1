import { BigNumber, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { DeployFunction, DeploymentsExtension } from "@anthonymartin/hardhat-deploy/types";
import { ThreeXBatchProcessing } from "../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();
  const { threeX } = addresses;
  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);
  const signerAddress = await signer.getAddress();

  if (["hardhat", "local"].includes(hre.network.name)) {
    const threeXBatch = await hre.ethers.getContractAt(
      "ThreeXBatchProcessing",
      (
        await deployments.get("ThreeXBatchProcessing")
      ).address,
      signer
    );
    const keeperIncentive = await hre.ethers.getContractAt(
      "KeeperIncentiveV2",
      (
        await deployments.get("KeeperIncentive")
      ).address,
      signer
    );
    await keeperIncentive.updateIncentive(threeXBatch.address, 0, 0, true, true, (await deployments.get("TestPOP")).address, 1, 0);
    await keeperIncentive.updateIncentive(threeXBatch.address, 1, 0, true, true, (await deployments.get("TestPOP")).address, 1, 0);
    await createDemoData(hre, deployments, signer, signerAddress, deploy, addresses, threeXBatch, threeX);
  }
};

async function createDemoData(
  hre: HardhatRuntimeEnvironment,
  deployments: DeploymentsExtension,
  signer: ethers.Signer,
  signerAddress: string,
  deploy: Function,
  addresses: any,
  threeXBatch: ThreeXBatchProcessing,
  setTokenAddress: string
): Promise<void> {
  console.log("creating demo data...");
  //await timeTravel(3000);
  await threeXBatch.setSlippage(100, 100);

  const usdc = await hre.ethers.getContractAt("MockERC20", addresses.usdc, signer);
  const setToken = await hre.ethers.getContractAt("MockERC20", setTokenAddress, signer);

  //Faucet
  await deploy("Faucet", {
    from: addresses.deployer,
    args: [addresses.uniswapRouter /* addresses.curveAddressProvider, addresses.curveFactoryMetapoolDepositZap */],
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
  const block = await hre.ethers.provider.getBlock("latest");
  console.log({ block });
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

func.dependencies = ["setup", "3x", "staking"];
func.tags = ["frontend", "3x-demo-data"];
