import { BigNumber, constants } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { PortfolioState } from "../../reducers/portfolio";
import useLog from "../../pop/utils/hooks/useLog";

export const useNetworth = (
  state: PortfolioState,
  expected: number,
  allContracts,
  updateNetworth,
  account?: string,
) => {
  const [networth, setNetworth] = useState<BigNumber | undefined>();

  const wallet = useMemo(() => (account && state.wallet[account]) || {}, [account, account && state.wallet?.[account]]);
  const contractsFetched = useMemo(
    () =>
      Object.keys(wallet)
        .map((chain) => Object.keys(wallet[chain]))
        .flat(),
    [wallet],
  );
  const balancesFetched = useMemo(
    () =>
      Object.keys(wallet)
        .map((chain) => Object.values(wallet[chain]))
        .flat()
        .filter((token) => token?.balanceFetched && token.balanceFetched > 0).length,
    [wallet],
  );

  useLog(
    {
      allContracts,
      contractsFetched,
      balancesFetched,
      expected,
      contracts: Object.keys(wallet)
        .map((chain) => Object.values(wallet[chain]))
        .flat().length,
      diff: allContracts.filter(
        (contract) => !contractsFetched.map((contract) => contract.toLowerCase()).includes(contract.toLowerCase()),
      ),
    },
    [contractsFetched, balancesFetched, expected, account, wallet],
  );

  useEffect(() => {
    if (contractsFetched.length >= expected && balancesFetched >= expected && !networth) {
      const networth = Object.values(wallet).reduce(
        (acc, { token }) => acc.add(token?.balance?.data?.value || constants.Zero),
        constants.Zero,
      );
      setNetworth(networth);
      updateNetworth?.(networth);
    }
  }, [contractsFetched, balancesFetched, networth, wallet, expected]);

  return networth;
};
