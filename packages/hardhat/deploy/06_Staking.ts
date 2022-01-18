import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import bluebird from "bluebird";
import { parseEther } from "ethers/lib/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { getStakingPools, Pool } from "../lib/utils/getStakingPools";
import { DAYS } from "../lib/utils/test";
import { MockERC20 } from "../typechain";
import { addContractToRegistry } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();

  const signer = await getSignerFrom(
    hre.config.namedAccounts.deployer as string,
    hre
  );

  const stakingPools = await getStakingPools(
    hre.network.config.chainId,
    addresses,
    deployments
  );

  for (var i = 0; i < stakingPools.length; i++) {
    const { poolName, rewardsToken, inputToken, contract } = stakingPools[i];
    await deploy(poolName, {
      from: addresses.deployer,
      args:
        contract === "PopLocker"
          ? [inputToken, (await deployments.get("RewardsEscrow")).address]
          : [
              rewardsToken,
              inputToken,
              (await deployments.get("RewardsEscrow")).address,
            ],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks,
      contract: contract,
      pre_eip1559: supportsEIP1559(hre),
    });
    await prepareRewardsEscrow(
      (
        await deployments.get(poolName)
      ).address,
      signer,
      hre
    );

    await addContractToRegistry(poolName, deployments, signer, hre);
  }

  if (["hardhat", "local"].includes(hre.network.name)) {
    await createDemoData(hre, stakingPools[1]);
    await createPopLockerData(hre, addresses, signer);
  }
};
export default main;
main.dependencies = ["setup"];
main.tags = ["core", "frontend"];

async function prepareRewardsEscrow(
  stakingAddress: string,
  signer: any,
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;
  const rewardsEscrow = await hre.ethers.getContractAt(
    "RewardsEscrow",
    await (
      await deployments.get("RewardsEscrow")
    ).address,
    signer
  );
  await rewardsEscrow.addAuthorizedContract(stakingAddress);
}

async function prepareStakingContract(
  POP: MockERC20,
  inputToken: MockERC20,
  contractAddress: string,
  signer: any,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  console.log("pop transfer:", POP.address);
  console.log("contract: ", contractAddress);
  await POP.transfer(contractAddress, parseEther("1000"));
  console.log("balance: ", (await POP.balanceOf(contractAddress)).toString());
  const stakingContract = await hre.ethers.getContractAt(
    "Staking",
    contractAddress,
    signer
  );
  await stakingContract.setEscrowDuration(7 * DAYS);
  console.log("Adding POP rewards to staking at:", contractAddress);
  await POP.approve(contractAddress, parseEther("1000"));
  await stakingContract.notifyRewardAmount(parseEther("1000"));
  console.log("Staking some Token...");
  await inputToken.approve(contractAddress, parseEther("100"));
  await stakingContract.connect(signer).stake(parseEther("100"));
  await bluebird.map(
    new Array(31).fill(0),
    async (_x, _i) => {
      await hre.network.provider.send("evm_increaseTime", [3600]);
      await hre.network.provider.send("evm_mine", []);
      await stakingContract.connect(signer).getReward();
    },
    { concurrency: 1 }
  );
  await hre.network.provider.send("evm_increaseTime", [3600]);
  await hre.network.provider.send("evm_mine", []);
}

async function connectAndMintToken(
  tokenAddress: string,
  signer: any,
  hre: HardhatRuntimeEnvironment
): Promise<MockERC20> {
  const token = (await hre.ethers.getContractAt(
    "MockERC20",
    tokenAddress,
    signer
  )) as MockERC20;
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

    const signer = await getSignerFrom(
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

async function createPopLockerData(hre, addresses, signer): Promise<void> {
  const stakingContract = await hre.ethers.getContractAt(
    "PopLocker",
    addresses.popStaking
  );
  const pop = await hre.ethers.getContractAt("MockERC20", addresses.pop);
  await pop
    .connect(signer)
    .approve(stakingContract.address, parseEther("1010"));
  await stakingContract
    .connect(signer)
    .addReward(
      addresses.pop,
      hre.config.namedAccounts.deployer as string,
      false
    );
  //Create withdrawable balance
  await stakingContract
    .connect(signer)
    .lock(hre.config.namedAccounts.deployer as string, parseEther("10"), 0);

  hre.network.provider.send("evm_increaseTime", [85 * DAYS]);
  hre.network.provider.send("evm_mine", []);

  await stakingContract
    .connect(signer)
    .notifyRewardAmount(addresses.pop, parseEther("1000"));
}

const supportsEIP1559 = (hre: HardhatRuntimeEnvironment): boolean => {
  const NOT_EIP1559Compatible = ["rinkarby", "mumbai", "polygon", "arbitrum"];
  return !NOT_EIP1559Compatible.includes(hre.network.name);
};
