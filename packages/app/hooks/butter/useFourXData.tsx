import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { BatchMetadata } from "@popcorn/utils/types";
import { ChainId } from "context/Web3/connectors";
import useERC20 from "hooks/tokens/useERC20";
import useThreePool from "hooks/useThreePool";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";
import { getData } from "../../helper/FourXDataUtils";
import useBasicIssuanceModule from "./useBasicIssuanceModule";
import useFourXBatch from "./useFourXBatch";
import useFourXZapper from "./useFourXZapper";
import useSetToken from "./useSetToken";

export default function useFourXData(): SWRResponse<BatchMetadata, Error> {
  const { contractAddresses, account, chainId } = useWeb3();
  const dai = useERC20(contractAddresses.dai);
  const usdc = useERC20(contractAddresses.usdc);
  const usdt = useERC20(contractAddresses.usdt);
  const fourX = useSetToken(contractAddresses.fourX);
  const fourXBatch = useFourXBatch();
  const fourXZapper = useFourXZapper();
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
    fourX &&
    fourXBatch &&
    fourXZapper &&
    setBasicIssuanceModule
  );

  return useSWR(shouldFetch ? [`fourX-batch-data`, chainId] : null, async () => {
    return getData(account, dai, usdc, usdt, threePool, fourX, setBasicIssuanceModule, fourXBatch, fourXZapper);
  });
}
