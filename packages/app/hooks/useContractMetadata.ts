import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { ChainId } from "@popcorn/utils";
import { useMemo } from "react";

export const useContractMetadata = (address: string, chainId: ChainId): { address: string; [key: string]: any } => {
  const addresses = useDeployment(chainId);
  return useMemo(() => {
    return {
      ...addresses[address?.toLowerCase()]?.metadata,
      address,
    };
  }, [chainId, address]);
};

export default useContractMetadata;
