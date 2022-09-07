import { Zapper } from "@popcorn/hardhat/lib/adapters";
import { ZeroXZapper__factory } from "@popcorn/hardhat/typechain";
import axios from "axios";
import { isAddress } from "ethers/lib/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useZeroXZapper(): Zapper {
  const { signerOrProvider, contractAddresses, account } = useWeb3();
  return useMemo(() => {
    if (isAddress(contractAddresses?.zeroXZapper))
      return new Zapper(axios, ZeroXZapper__factory.connect(contractAddresses?.zeroXZapper, signerOrProvider));
  }, [signerOrProvider, contractAddresses?.zeroXZapper, account]);
}
