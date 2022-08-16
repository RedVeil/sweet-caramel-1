import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { BatchMetadata } from "@popcorn/utils/src/types";
import useERC20 from "hooks/tokens/useERC20";
import useThreePool from "hooks/useThreePool";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";
import { getData } from "../../helper/ButterDataUtils";
import useBasicIssuanceModule from "./useBasicIssuanceModule";
import useButterBatch from "./useButterBatch";
import useButterBatchAdapter from "./useButterBatchAdapter";
import useButterBatchZapper from "./useButterBatchZapper";
import useSetToken from "./useSetToken";

export default function useButterBatchData(): SWRResponse<BatchMetadata, Error> {
  const { contractAddresses, account, chainId } = useWeb3();
  const dai = useERC20(contractAddresses.dai);
  const usdc = useERC20(contractAddresses.usdc);
  const usdt = useERC20(contractAddresses.usdt);
  const threeCrv = useERC20(contractAddresses.threeCrv);
  const butter = useSetToken(contractAddresses.butter);
  const butterBatch = useButterBatch();
  const butterBatchZapper = useButterBatchZapper();
  const setBasicIssuanceModule = useBasicIssuanceModule();
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
    butterBatch &&
    butterBatchZapper &&
    setBasicIssuanceModule
  );

  return useSWR(shouldFetch ? `butter-batch-data` : null, async () => {
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
      mainContract: butterBatch,
      zapperContract: butterBatchZapper,
    });
  });
}
