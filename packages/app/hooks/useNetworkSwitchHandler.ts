import { useWeb3React } from '@web3-react/core';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

export default function useNetworkSwitchHandler() {
  const { chainId } = useWeb3React();

  const prevChainId = React.useRef<number>(null);
  const router = useRouter();
  const routeName = router.pathname;

  useEffect(() => {
    if (prevChainId.current && chainId !== prevChainId.current && chainId) {
      // @Dev handle route specific behaviour here.

      localStorage.setItem('chainId', String(chainId));

      // For route staking/[id] we need to redirect the user back to the staking pools page.
      if (routeName === '/staking/[id]') {
        router.push('/staking');
      }
      // For all routes except staking/[id]
      window.location.reload();
    }
    prevChainId.current = chainId;
  }, [chainId]);
}
