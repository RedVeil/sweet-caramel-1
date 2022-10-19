import { ChainId } from "@popcorn/utils";
import { useDeployment } from "./useDeployment";

export const useSweetVaults = (chainId: ChainId) => {
  const { sEthSweetVault } = useDeployment(chainId);
  return [sEthSweetVault];
};
