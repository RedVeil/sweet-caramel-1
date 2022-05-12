import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { ButterBatchData } from "@popcorn/utils/src/types";
import useButter from "hooks/butter/useButter";
import useButterBatchAdapter from "hooks/butter/useButterBatchAdapter";
import useERC20 from "hooks/tokens/useERC20";
import useThreePool from "hooks/useThreePool";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";
import { getData } from "../../helper/ButterDataUtils";
import useBasicIssuanceModule from "./useBasicIssuanceModule";
import useButterWhaleProcessing from "./useButterWhaleProcessing";

export default function useButterWhaleData(): SWRResponse<ButterBatchData, Error> {
  const { contractAddresses, account, chainId } = useWeb3();
  const dai = useERC20(contractAddresses.dai);
  const usdc = useERC20(contractAddresses.usdc);
  const usdt = useERC20(contractAddresses.usdt);
  const threeCrv = useERC20(contractAddresses.threeCrv);
  const butter = useButter();
  const setBasicIssuanceModule = useBasicIssuanceModule();
  const whaleButter = useButterWhaleProcessing();
  const threePool = useThreePool();

  const butterBatchAdapter = useButterBatchAdapter();
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

  return useSWR(shouldFetch ? `butter-batch-data` : null, async () => {
    return getData(
      butterBatchAdapter,
      account,
      dai,
      usdc,
      usdt,
      threeCrv,
      threePool,
      butter,
      setBasicIssuanceModule,
      whaleButter,
    );
  });
}
