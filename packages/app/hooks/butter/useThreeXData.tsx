import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { BatchMetadata } from "@popcorn/utils/types";
import useERC20 from "hooks/tokens/useERC20";
import useThreePool from "hooks/useThreePool";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";
import { getData } from "../../helper/threeXDataUtils";
import useBasicIssuanceModule from "./useBasicIssuanceModule";
import useSetToken from "./useSetToken";
import useThreeXBatch from "./useThreeXBatch";
import useThreeXZapper from "./useThreeXZapper";

export default function useThreeXData(): SWRResponse<BatchMetadata, Error> {
  const { contractAddresses, account, chainId } = useWeb3();
  const dai = useERC20(contractAddresses.dai);
  const usdc = useERC20(contractAddresses.usdc);
  const usdt = useERC20(contractAddresses.usdt);
  const threeX = useSetToken(contractAddresses.threeX);
  const threeXBatch = useThreeXBatch();
  const threeXZapper = useThreeXZapper();
  const setBasicIssuanceModule = useBasicIssuanceModule();
  const threePool = useThreePool();

  const shouldFetch = !!(
    [ChainId.Ethereum, ChainId.Hardhat, ChainId.Localhost].includes(chainId) &&
    !!account &&
    contractAddresses.butter &&
    contractAddresses.usdt &&
    contractAddresses.usdc &&
    contractAddresses.dai &&
    isButterSupportedOnCurrentNetwork(chainId) &&
    dai &&
    usdc &&
    usdt &&
    threePool &&
    threeX &&
    threeXBatch &&
    threeXZapper &&
    setBasicIssuanceModule
  );

  return useSWR(shouldFetch ? [`threeX-batch-data`, chainId] : null, async () => {
    return getData(account, dai, usdc, usdt, threePool, threeX, setBasicIssuanceModule, threeXBatch, threeXZapper);
  });
}
