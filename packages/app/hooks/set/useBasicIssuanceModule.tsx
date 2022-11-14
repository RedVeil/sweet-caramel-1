import { isAddress } from "@ethersproject/address";
import { useRpcProvider } from "@popcorn/app/hooks/useRpcProvider";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { IBasicIssuanceModule, IBasicIssuanceModule__factory } from "@popcorn/hardhat/typechain";
import { useMemo } from "react";

export default function useBasicIssuanceModule(address, chainId): IBasicIssuanceModule {
  const { account } = useWeb3();
  const provider = useRpcProvider(chainId);

  return useMemo(() => {
    if (isAddress(address)) return IBasicIssuanceModule__factory.connect(address, provider);
  }, [account, provider, address, chainId]);
}
