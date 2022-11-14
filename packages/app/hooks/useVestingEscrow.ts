import { isAddress } from "@ethersproject/address";
import { useRpcProvider } from "@popcorn/app/hooks/useRpcProvider";
import { RewardsEscrow, RewardsEscrow__factory } from "@popcorn/hardhat/typechain";
import { ChainId } from "@popcorn/utils/src/connectors";
import { useMemo } from "react";

export default function useVestingEscrow(address: string, chainId: ChainId): RewardsEscrow {
  const provider = useRpcProvider(chainId);
  const rewardsEscrowContract = useMemo(() => {
    if (isAddress(address)) {
      return RewardsEscrow__factory.connect(address, provider);
    }
  }, [chainId, provider]);

  return rewardsEscrowContract;
}
