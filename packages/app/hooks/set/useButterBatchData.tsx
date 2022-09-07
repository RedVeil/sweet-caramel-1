import ButterBatchAdapter from "@popcorn/hardhat/lib/adapters/ButterBatchAdapter";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { BatchMetadata } from "@popcorn/utils/src/types";
import useERC20 from "hooks/tokens/useERC20";
import useERC20Permit from "hooks/tokens/useERC20Permit";
import useThreePool from "hooks/useThreePool";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";
import { getData } from "../../helper/ButterDataUtils";
import useBasicIssuanceModule from "./useBasicIssuanceModule";
import useButterBatch from "./useButterBatch";
import useButterBatchZapper from "./useButterBatchZapper";
import useSetToken from "./useSetToken";

export default function useButterBatchData(rpcProvider?): SWRResponse<BatchMetadata, Error> {
  const { contractAddresses, account, chainId } = useWeb3();
  const dai = useERC20(contractAddresses.dai, rpcProvider);
  const usdc = useERC20(contractAddresses.usdc, rpcProvider);
  const usdt = useERC20(contractAddresses.usdt, rpcProvider);
  const threeCrv = useERC20(contractAddresses.threeCrv, rpcProvider);
  const butter = useSetToken(contractAddresses.butter, rpcProvider);
  const butterBatch = useButterBatch(rpcProvider);
  const butterBatchZapper = useButterBatchZapper(rpcProvider);
  const setBasicIssuanceModule = useBasicIssuanceModule(rpcProvider);
  const threePool = useThreePool(rpcProvider);

  const butterBatchAdapter = new ButterBatchAdapter(butterBatch);
  const shouldFetch = !!(
    !!butterBatchAdapter &&
    !!account &&
    contractAddresses.butter &&
    contractAddresses.usdt &&
    contractAddresses.usdc &&
    contractAddresses.dai &&
    dai &&
    usdc &&
    usdt &&
    threeCrv &&
    threePool &&
    butter &&
    butterBatch &&
    butterBatchZapper &&
    setBasicIssuanceModule &&
    (rpcProvider || isButterSupportedOnCurrentNetwork(chainId))
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
