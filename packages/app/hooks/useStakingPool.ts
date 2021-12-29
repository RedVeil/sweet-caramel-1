import { isAddress } from '@ethersproject/address';
import { useWeb3React } from '@web3-react/core';
import { useMemo } from 'react';
import { Staking__factory } from '../../hardhat/typechain';

export default function useStakingPool(address: string | undefined) {
  const { library, account, chainId } = useWeb3React();

  return useMemo(
    () => (address && isAddress(address) && !!library
      ? Staking__factory.connect(address, library)
      : undefined),
    [address, library, account, chainId],
  );
}
