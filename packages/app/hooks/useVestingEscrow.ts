import { isAddress } from "@ethersproject/address";
import { RewardsEscrow, RewardsEscrow__factory } from "@popcorn/hardhat/typechain";
import { useMemo } from "react";
import useWeb3 from "./useWeb3";

export default function useVestingEscrow(address: string, rpcProvider?): RewardsEscrow {
  const { signerOrProvider, contractAddresses, account, chainId } = useWeb3();

  const rewardsEscrowContract = useMemo(() => {
    if (isAddress(address) && contractAddresses.has(address))
      return RewardsEscrow__factory.connect(address, rpcProvider ? rpcProvider : signerOrProvider);
  }, [chainId, account, signerOrProvider]);

  return rewardsEscrowContract;
}
