import { bigNumberToNumber } from '.';
import { ERC20, MockERC20, StakingRewards } from '../../hardhat/typechain';

export interface TokenBalances {
  pop: number;
  popEthLp: number;
  butter: number;
}

export interface ContractsWithBalance {
  pop: ERC20 | MockERC20 | StakingRewards;
  popEthLp: ERC20 | MockERC20 | StakingRewards;
  butter: ERC20 | MockERC20 | StakingRewards;
}

async function getBalances(
  account: string,
  contracts: ContractsWithBalance,
): Promise<TokenBalances> {
  return {
    pop: bigNumberToNumber(await contracts.pop.balanceOf(account)),
    popEthLp: bigNumberToNumber(await contracts.popEthLp.balanceOf(account)),
    butter: bigNumberToNumber(await contracts.butter.balanceOf(account)),
  };
}
export default getBalances;
