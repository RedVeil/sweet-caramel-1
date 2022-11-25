import { BigNumber, constants } from "ethers";
import { useEffect, useState } from "react";
import { PortfolioState } from "../../reducers/portfolio";

export const useNetworth = (state: PortfolioState, updateNetworth, account?: string) => {
  const [networth, setNetworth] = useState<BigNumber | undefined>();

  useEffect(() => {
    if (!account) return;
    let _networth = constants.Zero;
    Object.keys(state.wallet).forEach((chainId) => {
      if (state.wallet[chainId]?.[account])
        Object.keys(state.wallet[chainId]?.[account]).forEach((_token) => {
          const walletToken = state.wallet[chainId][account][_token];
          walletToken?.balance?.data?.value && walletToken?.balance?.data?.value.gt(constants.Zero)
            ? (_networth = _networth.add(walletToken.balanceValue?.data?.value || constants.Zero))
            : null;
          setNetworth(_networth);
          updateNetworth(_networth);
        });
    });
  }, [state.wallet, account]);

  return networth;
};
