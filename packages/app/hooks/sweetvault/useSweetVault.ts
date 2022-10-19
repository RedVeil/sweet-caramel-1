import { Vault__factory } from "@popcorn/hardhat/typechain";
import { ChainId, getSweetVault } from "@popcorn/utils";
import { SweetVaultWithMetadata } from "@popcorn/utils/types";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";
import useContractMetadata from "../useContractMetadata";
import { useRpcProvider } from "../useRpcProvider";

export default function useSweetVault(address: string, chainId: ChainId): SWRResponse<SweetVaultWithMetadata, Error> {
  const { account } = useWeb3();
  const shouldFetch = !!address && !!chainId;

  const provider = useRpcProvider(chainId);

  const metadata = useContractMetadata(address, chainId);

  return useSWR(
    shouldFetch ? [`getSweetVaultInfo-${address}`, account, chainId, metadata] : null,
    async (_key: string, account: string) => {
      const sweetVault = await getSweetVault(account, Vault__factory.connect(address, provider), chainId, provider);
      return {
        ...sweetVault,
        metadata: {
          ...sweetVault.metadata,
          ...metadata,
        },
      };
    },
  );
}
