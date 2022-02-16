import { useWeb3React } from "@web3-react/core";
import { Contract } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { useCallback } from "react";

export default function useIsContractReady(): (contract: Contract) => boolean {
  const { library, account, chainId } = useWeb3React();
  return useCallback(
    (contract: Contract) => !contract || !account || !chainId || !library || !isAddress(contract.address),
    [library, account, chainId],
  );
}
