import { DeploymentsExtension } from "@anthonymartin/hardhat-deploy/dist/types";
import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { ButterBatchProcessing } from "../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();
  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);
  const signerAddress = await signer.getAddress();

  if (["hardhat", "local"].includes(hre.network.name)) {
    const butterBatch = await hre.ethers.getContractAt(
      "ButterBatchProcessing",
      (
        await deployments.get("ButterBatchProcessing")
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
    await keeperIncentive.updateIncentive(
      butterBatch.address,
      0,
      0,
      true,
      true,
      (
        await deployments.get("TestPOP")
      ).address,
      1,
      0
    );
    await keeperIncentive.updateIncentive(
      butterBatch.address,
      1,
      0,
      true,
      true,
      (
        await deployments.get("TestPOP")
      ).address,
      1,
      0
    );

    await createDemoData(butterBatch, hre, deployments, signer, signerAddress, deploy, addresses);
  }
};

async function createDemoData(
  butterBatch: ButterBatchProcessing,
  hre: HardhatRuntimeEnvironment,
  deployments: DeploymentsExtension,
  signer: ethers.Signer,
  signerAddress: string,
  deploy: Function,
  addresses: any
): Promise<void> {
  console.log("creating demo data...");
  await butterBatch.connect(signer).setSlippage(200, 200);

  const threeCrv = await hre.ethers.getContractAt("MockERC20", addresses.threeCrv, signer);
  const butter = await hre.ethers.getContractAt("MockERC20", addresses.butter, signer);

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
func.dependencies = ["setup", "butter", "test-pop", "staking", "faucet"];
func.tags = ["frontend", "butter-demo-data"];
