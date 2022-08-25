import { Vault__factory } from "@popcorn/hardhat/typechain";
import { getSweetVault } from "@popcorn/utils";
import { SweetVaultWithMetadata } from "@popcorn/utils/types";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";

export default function useSweetVault(address: string): SWRResponse<SweetVaultWithMetadata, Error> {
  const { signerOrProvider, account, chainId } = useWeb3();
  const shouldFetch = !!address && !!chainId;

  return useSWR(
    shouldFetch ? [`getSweetVaultInfo-${address}`, account] : null,
    async (key: string, account: string) =>
      await getSweetVault(account, Vault__factory.connect(address, signerOrProvider), chainId, signerOrProvider),
  );
}
