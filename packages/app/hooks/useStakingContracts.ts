import { ChainId } from "@popcorn/utils";
import { useMemo } from "react";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";

export const useStakingContracts = (chainId: ChainId) => {
  const {
    butterStaking,
    popUsdcLpStaking,
    threeXStaking,
    popUsdcArrakisVaultStaking,
    sEthSweetVaultStaking,
    xenStaking,
  } = useDeployment(chainId);
  return useMemo(
    () =>
      [
        butterStaking,
        popUsdcLpStaking,
        threeXStaking,
        popUsdcArrakisVaultStaking,
        sEthSweetVaultStaking,
        xenStaking,
      ].filter((contract) => !!contract),
    [chainId],
  );
};
