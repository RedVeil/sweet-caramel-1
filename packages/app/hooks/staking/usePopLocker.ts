import { PopLocker__factory } from "@popcorn/hardhat/typechain";
import { ChainId, getPopLocker } from "@popcorn/utils";
import { PopLockerMetadata } from "@popcorn/utils/getStakingPool";
import { isAddress } from "ethers/lib/utils";
import { useRpcProvider } from "@popcorn/app/hooks/useRpcProvider";
import { useMemo } from "react";
import useSWR, { SWRResponse } from "swr";
import useWeb3 from "@popcorn/app/hooks/useWeb3";

export default function usePopLocker(address: string, chainId: ChainId): SWRResponse<PopLockerMetadata, Error> {
  const { account } = useWeb3();
  const provider = useRpcProvider(chainId);
  const popLocker = useMemo(
    () => isAddress(address) && !!chainId && !!provider && PopLocker__factory.connect(address, provider),
    [chainId, address, provider],
  );
  return useSWR(popLocker ? [`getPopLockerInfo`, address, chainId, account, provider] : null, (key) => {
    return getPopLocker(key, popLocker, chainId, account);
  });
}
