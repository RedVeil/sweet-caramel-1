// ------------------------ TODO - Should be moved to script helpers --------------------
export type Pool = {
  poolName: string;
  contract: string;
  inputToken: string;
  rewardsToken?: string;
};

export async function getStakingPools(
  chainId: number,
  addresses,
  deployments
): Promise<Pool[]> {
  switch (chainId) {
    case 1:
      return [
        {
          poolName: "PopStaking",
          contract: "PopLocker",
          inputToken: addresses.pop,
        },
        {
          poolName: "popEthLPStaking",
          contract: "Staking",
          inputToken: addresses.popEthLp,
          rewardsToken: addresses.pop,
        },
        {
          poolName: "butterStaking",
          contract: "Staking",
          inputToken: addresses.butter,
          rewardsToken: addresses.pop,
        },
      ];
    case 1337:
      return [
        {
          poolName: "PopStaking",
          contract: "PopLocker",
          inputToken: (await deployments.get("TestPOP")).address,
        },
        {
          poolName: "popEthLPStaking",
          contract: "Staking",
          inputToken: (await deployments.get("POP_ETH_LP")).address,
          rewardsToken: (await deployments.get("TestPOP")).address,
        },
        {
          poolName: "butterStaking",
          contract: "Staking",
          inputToken: addresses.butter,
          rewardsToken: (await deployments.get("TestPOP")).address,
        },
      ];
    case 31337:
      return [
        {
          poolName: "PopStaking",
          contract: "PopLocker",
          inputToken: (await deployments.get("TestPOP")).address,
        },
        {
          poolName: "popEthLPStaking",
          contract: "Staking",
          inputToken: (await deployments.get("POP_ETH_LP")).address,
          rewardsToken: (await deployments.get("TestPOP")).address,
        },
        {
          poolName: "butterStaking",
          contract: "Staking",
          inputToken: addresses.butter,
          rewardsToken: (await deployments.get("TestPOP")).address,
        },
      ];
    case 137:
      return [
        {
          poolName: "PopStaking",
          contract: "PopLocker",
          inputToken: (await deployments.get("TestPOP")).address,
        },
        {
          poolName: "popEthLPStaking",
          contract: "Staking",
          inputToken: (await deployments.get("POP_ETH_LP")).address,
          rewardsToken: (await deployments.get("TestPOP")).address,
        },
      ];
    default:
      return [
        {
          poolName: "PopStaking",
          contract: "PopLocker",
          inputToken: (await deployments.get("TestPOP")).address,
        },
        {
          poolName: "popEthLPStaking",
          contract: "Staking",
          inputToken: (await deployments.get("POP_ETH_LP")).address,
          rewardsToken: (await deployments.get("TestPOP")).address,
        },
      ];
  }
}
// -------------------------
