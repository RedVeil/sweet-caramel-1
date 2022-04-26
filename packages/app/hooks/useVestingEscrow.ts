import { isAddress } from "@ethersproject/address";
import { RewardsEscrow, RewardsEscrow__factory } from "@popcorn/hardhat/typechain";
import { useMemo } from "react";
import useWeb3 from "./useWeb3";

export default function useVestingEscrow(address: string): RewardsEscrow {
  const { signerOrProvider, contractAddresses, account, chainId } = useWeb3();

  const stakingContract = useMemo(() => {
    if (isAddress(address) && contractAddresses.has(address))
      return RewardsEscrow__factory.connect(address, signerOrProvider);
  }, [chainId, account, signerOrProvider]);
  return stakingContract;
}
