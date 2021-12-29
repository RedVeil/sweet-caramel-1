import { isAddress } from '@ethersproject/address';
import { useWeb3React } from '@web3-react/core';
import { useMemo } from 'react';
import { RewardsEscrow__factory } from '../../hardhat/typechain';

export default function useVestingEscrow(address: string | undefined) {
  const { library, account, chainId } = useWeb3React();

  return useMemo(
    () =>
      address && isAddress(address) && !!library
        ? RewardsEscrow__factory.connect(address, library.getSigner())
        : undefined,
    [address, library, account, chainId],
  );
}
