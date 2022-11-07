import { isAddress } from "@ethersproject/address";
import { Curve3Pool, Curve3Pool__factory } from "@popcorn/hardhat/typechain";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";
import { useRpcProvider } from "./useRpcProvider";

export default function useThreePool(address, chainId): Curve3Pool {
  const { account } = useWeb3();

  const provider = useRpcProvider(chainId);

  return useMemo(() => {
    if (isAddress(address)) return Curve3Pool__factory.connect(address, provider);
  }, [, account, provider, address, chainId]);
}
