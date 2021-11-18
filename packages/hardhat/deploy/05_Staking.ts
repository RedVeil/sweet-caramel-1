import { parseEther } from "@ethersproject/units";
import { DeploymentsExtension } from "hardhat-deploy/dist/types";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { MockERC20 } from "../typechain";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();

  await deploy("PopStaking", {
    from: addresses.deployer,
    args: [addresses.pop, addresses.pop],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks,
    contract: "StakingRewards",
  });

  await deploy("popEthLPStaking", {
    from: addresses.deployer,
    args: [addresses.pop, addresses.popEthLp],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "StakingRewards",
  });

  await deploy("butterStaking", {
    from: addresses.deployer,
    args: [addresses.pop, addresses.butter],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "StakingRewards",
  });

  if (["hardhat", "local"].includes(hre.network.name)) {
    createDemoData(hre, deployments);
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
  deployments: DeploymentsExtension
): Promise<void> {
  const pop = await deployments.get("TestPOP");
  const popEthLp = await deployments.get("POP_ETH_LP");

  const signer = getSignerFrom(
    hre.config.namedAccounts.deployer as string,
    hre
  );

  // fund pop staking rewards
  const popToken = await connectAndMintToken(pop.address, signer, hre);

  await prepareStakingContract(
    popToken,
    popToken,
    (
      await deployments.get("PopStaking")
    ).address,
    signer,
    hre
  );

  const popEthLpToken = (await connectAndMintToken(
    popEthLp.address,
    signer,
    hre
  )) as MockERC20;

  await prepareStakingContract(
    popToken,
    popEthLpToken,
    (
      await deployments.get("popEthLPStaking")
    ).address,
    signer,
    hre
  );
}
