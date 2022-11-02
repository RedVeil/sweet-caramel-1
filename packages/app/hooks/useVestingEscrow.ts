import { isAddress } from "@ethersproject/address";
import { RewardsEscrow, RewardsEscrow__factory } from "@popcorn/hardhat/typechain";
import { useMemo } from "react";
import { ChainId } from "../../utils/src/connectors";
import { useRpcProvider } from "./useRpcProvider";

export default function useVestingEscrow(address: string, chainId: ChainId): RewardsEscrow {
  const provider = useRpcProvider(chainId);
  const rewardsEscrowContract = useMemo(() => {
    if (isAddress(address)) {
      return RewardsEscrow__factory.connect(address, provider);
    }
  }, [chainId, provider]);

  return rewardsEscrowContract;
}
