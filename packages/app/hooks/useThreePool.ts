import { isAddress } from "@ethersproject/address";
import { Curve3Pool, Curve3Pool__factory } from "@popcorn/hardhat/typechain";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useThreePool(): Curve3Pool {
  const { signerOrProvider, contractAddresses, account } = useWeb3();

  return useMemo(() => {
    if (isAddress(contractAddresses?.butterDependency?.threePool))
      return Curve3Pool__factory.connect(contractAddresses?.butterDependency?.threePool, signerOrProvider);
  }, [, account, signerOrProvider, contractAddresses?.butterDependency?.threePool]);
}
