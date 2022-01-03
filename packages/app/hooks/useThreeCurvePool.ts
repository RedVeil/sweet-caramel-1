import { isAddress } from '@ethersproject/address';
import { useWeb3React } from '@web3-react/core';
import { useMemo } from 'react';
import { MockCurveThreepool__factory } from '../../hardhat/typechain/factories/MockCurveThreepool__factory';

export default function useThreeCurvePool(address: string | undefined) {
  const { library, account, chainId } = useWeb3React();

  return useMemo(
    () =>
      address && isAddress(address) && !!library
        ? MockCurveThreepool__factory.connect(address, library)
        : undefined,
    [address, library, account, chainId],
  );
}
