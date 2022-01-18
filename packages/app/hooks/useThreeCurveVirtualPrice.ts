import { useWeb3React } from '@web3-react/core';
import { BigNumber } from 'ethers/lib/ethers';
import { isAddress } from 'ethers/lib/utils';
import { useCallback } from 'react';
import useThreeCurvePool from './useThreeCurvePool';

export default function useThreeCurveVirtualPrice(
  threePoolAddress: string | undefined,
) {
  const { library, account, chainId } = useWeb3React();

  const threePool = useThreeCurvePool(threePoolAddress);

  return useCallback(async (): Promise<BigNumber | null> => {
    if (!isAddress(threePoolAddress)) {
      return null;
    }
    if ((await threePool.provider.getNetwork()).chainId !== chainId) {
      return null;
    }
    return await threePool.get_virtual_price();
  }, [library, account, chainId, threePoolAddress]);
}
