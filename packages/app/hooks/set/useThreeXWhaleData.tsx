import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { BatchMetadata } from "@popcorn/utils/types";
import useERC20 from "hooks/tokens/useERC20";
import useThreePool from "hooks/useThreePool";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";
import { getDataWhale } from "../../helper/threeXDataUtils";
import useThreeXWhale from "./useThreeXWhale";
import useBasicIssuanceModule from "../set/useBasicIssuanceModule";
import useSetToken from "../set/useSetToken";
import useThreeXBatch from "../set/useThreeXBatch";

export default function useThreeXWhaleData(): SWRResponse<BatchMetadata, Error> {
  const { contractAddresses, account, chainId } = useWeb3();
  const dai = useERC20(contractAddresses.dai);
  const usdc = useERC20(contractAddresses.usdc);
  const usdt = useERC20(contractAddresses.usdt);
  const threeX = useSetToken(contractAddresses.threeX);
  const threeXWhale = useThreeXWhale();
  const threeXBatch = useThreeXBatch();
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
    threeXWhale &&
    setBasicIssuanceModule
  );

  return useSWR(shouldFetch ? [`threeX-whale-data`, chainId] : null, async () => {
    return getDataWhale(account, dai, usdc, usdt, threePool, threeX, setBasicIssuanceModule, threeXWhale, threeXBatch);
  });
}
