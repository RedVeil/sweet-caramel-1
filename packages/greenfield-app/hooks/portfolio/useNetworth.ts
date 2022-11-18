import { BigNumber, constants } from "ethers";
import { useEffect, useState } from "react";
import { PortfolioState } from "../../reducers/portfolio";

export const useNetworth = (state: PortfolioState, updateNetworth, account: string) => {
  const [networth, setNetworth] = useState<BigNumber | undefined>(constants.Zero);

  useEffect(() => {
    let _networth = constants.Zero;
    Object.keys(state.wallet).forEach((chainId) => {
      if (state.wallet[chainId]?.[account])
        Object.keys(state.wallet[chainId]?.[account]).forEach((_token) => {
          const walletToken = state.wallet[chainId][account][_token];
          walletToken.value && walletToken.value.gt(constants.Zero)
            ? (_networth = _networth.add(walletToken.value))
            : null;
          setNetworth(_networth);
          updateNetworth(_networth);
        });
    });
  }, [state.wallet]);

  return networth;
};
