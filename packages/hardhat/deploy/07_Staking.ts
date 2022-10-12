import { parseEther } from "ethers/lib/utils";
import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { getStakingPools } from "../lib/utils/getStakingPools";
import { addContractToRegistry } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();
  const pop = addresses.pop;

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  const stakingPools = await getStakingPools(hre.network.config.chainId, addresses, deployments);

  for (var i = 0; i < stakingPools.length; i++) {
    const { poolName, rewardsToken, inputToken, contract } = stakingPools[i];
    const deployed = await deploy(poolName, {
      from: addresses.deployer,
      args:
        contract === "PopLocker"
          ? [inputToken, (await deployments.get("RewardsEscrow")).address]
          : [rewardsToken, inputToken, (await deployments.get("RewardsEscrow")).address],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks,
      contract: contract,
    });
    await prepareRewardsEscrow((await deployments.get(poolName)).address, signer, hre);

    await addContractToRegistry(poolName, deployments, signer, hre);
    if (contract === "PopLocker") {
      const popLocker = await hre.ethers.getContractAt("PopLocker", deployed.address);

      console.log("setting approvals ...");
      const approvalTx = await popLocker.connect(signer).setApprovals();
      if (!["hardhat", "local"].includes(hre.network.name)) {
        await approvalTx.wait(2);
      }

      console.log("adding pop as rewards tokens with reward distributor ...");
      const addRewardTx = await popLocker
        .connect(signer)
        .addReward(inputToken, (await hre.deployments.get("RewardsDistribution")).address, true);
      if (!["hardhat", "local"].includes(hre.network.name)) {
        await addRewardTx.wait(2);
      }
    } else {
      console.log("approving RewardsDistribution contract as rewards distributor ...");
      const addApprovalTx = await (
        await hre.ethers.getContractAt("Staking", deployed.address)
      ).approveRewardDistributor((await hre.deployments.get("RewardsDistribution")).address, true);
      if (!["hardhat", "local"].includes(hre.network.name)) {
        await addApprovalTx.wait(2);
      }
    }
  }
};
export default main;
main.dependencies = ["setup", "contract-registry", "rewards-escrow", "rewards-distribution"];
main.tags = ["frontend", "staking", "grants"];

async function prepareRewardsEscrow(stakingAddress: string, signer: any, hre: HardhatRuntimeEnvironment) {
  console.log("preparing rewards escrow ...");
  const { deployments } = hre;
  const rewardsEscrow = await hre.ethers.getContractAt(
    "RewardsEscrow",
    await (
      await deployments.get("RewardsEscrow")
    ).address,
    signer
  );
  const tx = await rewardsEscrow.addAuthorizedContract(stakingAddress);
  if (!["hardhat", "local"].includes(hre.network.name)) {
    await tx.wait(2);
  }
}

