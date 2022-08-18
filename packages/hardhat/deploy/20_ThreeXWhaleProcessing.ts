import { DeployFunction, DeploymentsExtension } from "@anthonymartin/hardhat-deploy/types";
import { BigNumber, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();
  const { threeXStaking, threePool, threeX, dai, usdc, usdt } = addresses;
  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);
  const signerAddress = await signer.getAddress();

  //ContractRegistry
  const contractRegistryAddress = (await deployments.get("ContractRegistry")).address;
  const threeXBatchAdress = (await deployments.get("ThreeXBatchProcessing")).address;
  const threeXBatchVaultAdress = (await deployments.get("ThreeXBatchVault")).address;
  const threeXBatchProcessing = await hre.ethers.getContractAt("ThreeXBatchProcessing", threeXBatchAdress, signer);

  const threeXBatchVaultContract = await hre.ethers.getContractAt("ThreeXBatchVault", threeXBatchVaultAdress, signer);

  //Butter Batch
  console.log("deploying threeXWhaleProcessing...");

  const processing = await deploy("ThreeXWhaleProcessing", {
    from: addresses.deployer,
    args: [contractRegistryAddress, addresses.setBasicIssuanceModule, threeXStaking, threePool, [dai, usdc, usdt]],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  console.log("adding ThreeXWhaleProcessing to contract registry...");
  await addContractToRegistry("ThreeXWhaleProcessing", deployments, signer, hre);

  const processingContractAdress = (await deployments.get("ThreeXWhaleProcessing")).address;
  const processingContract = await hre.ethers.getContractAt("ThreeXWhaleProcessing", processingContractAdress, signer);

  console.log("setting ThreeXWhaleProcessing approvals ... ");
  const approvalsTx = await processingContract.setApprovals();
  if (!["hardhat", "local"].includes(hre.network.name)) {
    await approvalsTx.wait();
  }

  console.log("Setting Fees for ThreeXWhaleProcessing");
  await processingContract.setFee(ethers.utils.formatBytes32String("mint"), 75, ethers.constants.AddressZero, threeX);
  await processingContract.setFee(ethers.utils.formatBytes32String("redeem"), 75, ethers.constants.AddressZero, usdc);

  console.log("setting ACLRegistry Roles for ThreeXWhaleProcessing");
  const aclRegistry = await hre.ethers.getContractAt(
    "ACLRegistry",
    (
      await deployments.get("ACLRegistry")
    ).address,
    signer
  );
  await aclRegistry.grantRole(ethers.utils.id("ApprovedContract"), processingContractAdress);
  await aclRegistry.grantRole(ethers.utils.id("Keeper"), processingContractAdress);
  console.log(`Finished deploying ThreeXWhaleProcessing at ${processingContractAdress}`);
};

export default func;

func.dependencies = ["setup"];
func.tags = ["frontend", "3x"];
