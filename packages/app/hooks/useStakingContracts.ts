import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { ChainId } from "@popcorn/utils";
import { useMemo } from "react";

export const useStakingContracts = (chainId: ChainId) => {
  const { butterStaking, threeXStaking, sEthSweetVaultStaking, xenStaking } = useDeployment(chainId);
  return useMemo(
    () => [butterStaking, threeXStaking, sEthSweetVaultStaking, xenStaking].filter((contract) => !!contract),
    [chainId],
  );
};
