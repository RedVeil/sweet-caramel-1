import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { ChainId } from "@popcorn/utils";

export const useSweetVaults = (chainId: ChainId) => {
  const { sEthSweetVault } = useDeployment(chainId);
  return [sEthSweetVault];
};
