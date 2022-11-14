import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { ChainId } from "@popcorn/utils";

export default function useSetTokenAddresses(chainId: ChainId) {
  const { butter, threeX } = useDeployment(chainId);
  return { butter, threeX };
}
