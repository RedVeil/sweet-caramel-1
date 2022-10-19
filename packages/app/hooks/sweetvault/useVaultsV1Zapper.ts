import { Zapper } from "@popcorn/hardhat/lib/adapters";
import { VaultsV1Zapper__factory } from "@popcorn/hardhat/typechain";
import { ChainId } from "@popcorn/utils";
import axios from "axios";
import { isAddress } from "ethers/lib/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useVaultsV1Zapper(address: string, chainId: ChainId): Zapper {
  const { signerOrProvider, account } = useWeb3();
  return useMemo(() => {
    if (isAddress(address)) return new Zapper(axios, VaultsV1Zapper__factory.connect(address, signerOrProvider));
  }, [signerOrProvider, address, chainId, account]);
}
