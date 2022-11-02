import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { BatchMetadata } from "@popcorn/utils/types";
import useERC20 from "@popcorn/app/hooks/tokens/useERC20";
import useThreePool from "@popcorn/app/hooks/useThreePool";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";
import { getData } from "@popcorn/app/helper/threeXDataUtils";
import useBasicIssuanceModule from "./useBasicIssuanceModule";
import useSetToken from "./useSetToken";
import useThreeXBatch from "./useThreeXBatch";
import useThreeXZapper from "./useThreeXZapper";

export default function useThreeXData(rpcProvider?): SWRResponse<BatchMetadata, Error> {
  const { contractAddresses, account, chainId } = useWeb3();
  const dai = useERC20(contractAddresses.dai, rpcProvider);
  const usdc = useERC20(contractAddresses.usdc, rpcProvider);
  const usdt = useERC20(contractAddresses.usdt, rpcProvider);
  const threeX = useSetToken(contractAddresses.threeX, rpcProvider);
  const threeXBatch = useThreeXBatch(rpcProvider);
  const threeXZapper = useThreeXZapper(rpcProvider);
  const setBasicIssuanceModule = useBasicIssuanceModule(rpcProvider);
  const threePool = useThreePool(rpcProvider);

  const shouldFetch = !!(
    [ChainId.Ethereum, ChainId.Hardhat, ChainId.Localhost].includes(chainId) &&
    !!account &&
    contractAddresses.butter &&
    contractAddresses.usdt &&
    contractAddresses.usdc &&
    contractAddresses.dai &&
    dai &&
    usdc &&
    usdt &&
    threePool &&
    threeX &&
    threeXBatch &&
    threeXZapper &&
    setBasicIssuanceModule &&
    (rpcProvider || isButterSupportedOnCurrentNetwork(chainId))
  );

  return useSWR(shouldFetch ? [`threeX-batch-data`, chainId] : null, async () => {
    return getData(account, dai, usdc, usdt, threePool, threeX, setBasicIssuanceModule, threeXBatch, threeXZapper);
  });
}
