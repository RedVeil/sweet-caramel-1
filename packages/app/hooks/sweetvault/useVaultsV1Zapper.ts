import { Zapper } from "@popcorn/hardhat/lib/adapters";
import { VaultsV1Zapper__factory } from "@popcorn/hardhat/typechain";
import axios from "axios";
import { isAddress } from "ethers/lib/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useVaultsV1Zapper(): Zapper {
  const { signerOrProvider, contractAddresses, account } = useWeb3();
  return useMemo(() => {
    if (isAddress(contractAddresses?.vaultsV1Zapper))
      return new Zapper(axios, VaultsV1Zapper__factory.connect(contractAddresses?.vaultsV1Zapper, signerOrProvider));
  }, [signerOrProvider, contractAddresses?.vaultsV1Zapper, account]);
}
