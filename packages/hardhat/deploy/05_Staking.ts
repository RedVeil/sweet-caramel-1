import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { parseEther } from "ethers/lib/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { MockERC20 } from "../typechain";

type Pool = {
  poolName: string;
  contract: string;
  inputToken: string;
  inputTokenDeploymentName: string;
  rewardsToken: string;
  rewardTokenDeploymentName: string;
};

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();

  const stakingPools: Pool[] = [
    {
      poolName: "PopStaking",
      contract: "StakingRewards",
      inputToken: addresses.pop,
      inputTokenDeploymentName: "TestPOP",
      rewardsToken: addresses.pop,
      rewardTokenDeploymentName: "TestPOP",
    },
    {
      poolName: "popEthLPStaking",
      contract: "StakingRewards",
      inputToken: addresses.popEthLp,
      inputTokenDeploymentName: "POP_ETH_LP",
      rewardsToken: addresses.pop,
      rewardTokenDeploymentName: "TestPOP",
    },
  ];

  for (var i = 0; i < stakingPools.length; i++) {
    await deploy(stakingPools[i].poolName, {
      from: addresses.deployer,
      args: [stakingPools[i].rewardsToken, stakingPools[i].inputToken],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks,
      contract: stakingPools[i].contract,
    });
    if (["hardhat", "local"].includes(hre.network.name)) {
      createDemoData(hre, stakingPools[i]);
    }
  }
};
export default main;

async function prepareStakingContract(
  POP: MockERC20,
  inputToken: MockERC20,
  contractAddress: string,
  signer: any,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  await (await POP.mint(contractAddress, parseEther("1000000000"))).wait(1);
  const stakingContract = await hre.ethers.getContractAt(
    "StakingRewards",
    contractAddress,
    signer
  );
  console.log("Adding POP rewards to staking at:", stakingContract.address);
  await (await stakingContract.notifyRewardAmount(parseEther("1000"))).wait(1);
  console.log("Staking some Token...");
  await inputToken.approve(contractAddress, parseEther("1000"));
  await stakingContract.connect(signer).stake(parseEther("100"));
}

async function connectAndMintToken(
  tokenAddress: string,
  signer: any,
  hre: HardhatRuntimeEnvironment
): Promise<MockERC20> {
  const token = await hre.ethers.getContractAt(
    "MockERC20",
    tokenAddress,
    signer
  );
  await (
    await token.mint(await signer.getAddress(), parseEther("1000000000"))
  ).wait(1);
  return token;
}

async function createDemoData(
  hre: HardhatRuntimeEnvironment,
  pool: Pool
): Promise<void> {
  try {
    const { deployments } = hre;
    const inputToken = await deployments.get(pool.inputTokenDeploymentName);
    const rewardsToken = await deployments.get(pool.rewardTokenDeploymentName);

    const signer = getSignerFrom(
      hre.config.namedAccounts.deployer as string,
      hre
    );
    // fund Pool staking rewards
    const poolInputTokens = await connectAndMintToken(
      pool.inputToken,
      signer,
      hre
    );
    const poolRewardTokens = await connectAndMintToken(
      pool.rewardsToken,
      signer,
      hre
    );
    await prepareStakingContract(
      poolRewardTokens,
      poolInputTokens,
      (
        await deployments.get(pool.poolName)
      ).address,
      signer,
      hre
    );
  } catch (ex) {
    console.log(ex.toString());
    process.exit(1);
  }
}
