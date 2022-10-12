import { parseEther } from "ethers/lib/utils";
import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { getStakingPools, Pool } from "../lib/utils/getStakingPools";
import { DAYS } from "../lib/utils/test";
import { MockERC20 } from "../typechain";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const addresses = await getNamedAccounts();

  if (["hardhat", "local"].includes(hre.network.name)) {
    await createPopLockerData(hre, deployments, await getSignerFrom(hre.config.namedAccounts.deployer as string, hre));
  }
};
export default main;
main.dependencies = ["setup", "staking"];
main.tags = ["frontend", "staking-demo-data", "grants"];

async function createPopLockerData(hre, deployments, signer): Promise<void> {
  console.log("popLockerData");
  await connectAndMintToken(await (await deployments.get("TestPOP")).address, signer, hre);

  const rewardsDistribution = await hre.ethers.getContractAt(
    "RewardsDistribution",
    await (
      await deployments.get("RewardsDistribution")
    ).address
  );
  const stakingContract = await hre.ethers.getContractAt(
    "PopLocker",
    await (
      await deployments.get("PopLocker")
    ).address
  );
  console.log("rewardsDistro");
  await rewardsDistribution.connect(signer).addRewardDistribution(stakingContract.address, parseEther("1000"), true);

  const pop = await hre.ethers.getContractAt("MockERC20", await (await deployments.get("TestPOP")).address);

  await pop.connect(signer).approve(stakingContract.address, parseEther("10"));
  await pop.connect(signer).transfer(rewardsDistribution.address, parseEther("20000"));

  //Create withdrawable balance
  await stakingContract.connect(signer).lock(await signer.getAddress(), parseEther("10"), 0);
  await rewardsDistribution.connect(signer).distributeRewards();
}


async function connectAndMintToken(
  tokenAddress: string,
  signer: any,
  hre: HardhatRuntimeEnvironment
): Promise<MockERC20> {
  const token = (await hre.ethers.getContractAt("MockERC20", tokenAddress, signer)) as MockERC20;
  await (await token.mint(await signer.getAddress(), parseEther("1000000000"))).wait(1);
  return token;
}
