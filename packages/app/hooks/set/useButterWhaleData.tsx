import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { BatchMetadata } from "@popcorn/utils/src/types";
import useButterBatchAdapter from "hooks/set/useButterBatchAdapter";
import useERC20 from "hooks/tokens/useERC20";
import useThreePool from "hooks/useThreePool";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";
import { getData } from "../../helper/ButterDataUtils";
import useBasicIssuanceModule from "./useBasicIssuanceModule";
import useButterBatch from "./useButterBatch";
import useButterWhaleProcessing from "./useButterWhaleProcessing";
import useSetToken from "./useSetToken";

export default function useButterWhaleData(): SWRResponse<BatchMetadata, Error> {
  const { contractAddresses, account, chainId } = useWeb3();
  const dai = useERC20(contractAddresses.dai);
  const usdc = useERC20(contractAddresses.usdc);
  const usdt = useERC20(contractAddresses.usdt);
  const threeCrv = useERC20(contractAddresses.threeCrv);
  const butter = useSetToken(contractAddresses.butter);
  const butterBatch = useButterBatch();
  const setBasicIssuanceModule = useBasicIssuanceModule();
  const whaleButter = useButterWhaleProcessing();
  const threePool = useThreePool();

  const butterBatchAdapter = useButterBatchAdapter(butterBatch);
  const shouldFetch = !!(
    !!butterBatchAdapter &&
    !!account &&
    contractAddresses.butter &&
    contractAddresses.usdt &&
    contractAddresses.usdc &&
    contractAddresses.dai &&
    isButterSupportedOnCurrentNetwork(chainId) &&
    dai &&
    usdc &&
    usdt &&
    threeCrv &&
    threePool &&
    butter &&
    whaleButter &&
    setBasicIssuanceModule
  );

  return useSWR(shouldFetch ? `butter-whale-data` : null, async () => {
    return getData({
      butterBatchAdapter,
      account,
      dai,
      usdc,
      usdt,
      threeCrv,
      threePool,
      butter,
      setBasicIssuanceModule,
      mainContract: whaleButter,
    });
  });
}