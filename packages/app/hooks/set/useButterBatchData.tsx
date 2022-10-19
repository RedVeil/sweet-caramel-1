import ButterBatchAdapter from "@popcorn/hardhat/lib/adapters/ButterBatchAdapter";
import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { BatchMetadata } from "@popcorn/utils/src/types";
import useERC20 from "hooks/tokens/useERC20";
import { useDeployment } from "hooks/useDeployment";
import useThreePool from "hooks/useThreePool";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";
import { getData } from "../../helper/ButterDataUtils";
import useBasicIssuanceModule from "./useBasicIssuanceModule";
import useButterBatch from "./useButterBatch";
import useButterBatchZapper from "./useButterBatchZapper";
import useSetToken from "./useSetToken";

export default function useButterBatchData(chainId: ChainId): SWRResponse<BatchMetadata, Error> {
  const { account } = useWeb3();
  const addr = useDeployment(chainId);
  const dai = useERC20(addr.dai, chainId);
  const usdc = useERC20(addr.usdc, chainId);
  const usdt = useERC20(addr.usdt, chainId);
  const threeCrv = useERC20(addr.threeCrv, chainId);
  const butter = useSetToken(addr.butter, chainId);
  const butterBatch = useButterBatch(addr.butterBatch, chainId);
  const butterBatchZapper = useButterBatchZapper(addr.butterBatchZapper, chainId);
  const setBasicIssuanceModule = useBasicIssuanceModule(addr.setBasicIssuanceModule, chainId);
  const threePool = useThreePool(addr.threePool, chainId);

  const butterBatchAdapter = new ButterBatchAdapter(butterBatch);
  const shouldFetch = !!(
    !!butterBatchAdapter &&
    addr.butter &&
    addr.usdt &&
    addr.usdc &&
    addr.dai &&
    dai &&
    usdc &&
    usdt &&
    threeCrv &&
    threePool &&
    butter &&
    butterBatch &&
    butterBatchZapper &&
    setBasicIssuanceModule &&
    isButterSupportedOnCurrentNetwork(chainId)
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
