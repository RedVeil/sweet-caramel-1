import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { ChainId } from "@popcorn/utils";

export default function useSweetVaultAddresses(chainId: ChainId) {
  const { sEthSweetVault } = useDeployment(chainId);
  return { sEthSweetVault };
}
