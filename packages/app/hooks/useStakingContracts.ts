import { ChainId } from "@popcorn/utils";
import { useMemo } from "react";
import { useDeployment } from "./useDeployment";

export const useStakingContracts = (chainId: ChainId) => {
  const { butterStaking, popUsdcLpStaking, threeXStaking, popUsdcArrakisVaultStaking, sEthSweetVaultStaking } =
    useDeployment(chainId);
  return useMemo(
    () =>
      [butterStaking, popUsdcLpStaking, threeXStaking, popUsdcArrakisVaultStaking, sEthSweetVaultStaking].filter(
        (contract) => !!contract,
      ),
    [chainId],
  );
};
