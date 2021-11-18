import { BigNumber } from 'ethers';
import { bigNumberToNumber } from '.';

export interface TokenBalances {
  pop: number;
  popEthLp: number;
  butter: number;
}
export interface BalanceOf {
  balanceOf: (address: string) => Promise<BigNumber>;
}

export interface ContractsWithBalance {
  pop: BalanceOf;
  popEthLp: BalanceOf;
  butter: BalanceOf;
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
