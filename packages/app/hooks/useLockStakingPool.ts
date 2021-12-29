import { isAddress } from '@ethersproject/address';
import { useWeb3React } from '@web3-react/core';
import { useMemo } from 'react';
import { LockStaking__factory } from '../../hardhat/typechain';

export default function useLockStakingPool(
  address: string | undefined = '0x8b415a7c4917D292a9CFC83c8B03c25D62C751E5',
) {
  const { library, account, chainId } = useWeb3React();

  return useMemo(
    () =>
      address && isAddress(address) && !!library
        ? LockStaking__factory.connect(address, library)
        : undefined,
    [address, library, account, chainId],
  );
}
