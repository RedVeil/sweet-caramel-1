import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { BatchMetadata } from "@popcorn/utils/types";
import useERC20 from "hooks/tokens/useERC20";
import { useDeployment } from "hooks/useDeployment";
import useThreePool from "hooks/useThreePool";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";
import { getData } from "../../helper/threeXDataUtils";
import useBasicIssuanceModule from "./useBasicIssuanceModule";
import useSetToken from "./useSetToken";
import useThreeXBatch from "./useThreeXBatch";
import useThreeXZapper from "./useThreeXZapper";

export default function useThreeXData(chainId: ChainId): SWRResponse<BatchMetadata, Error> {
  const { account } = useWeb3();
  const contractAddresses = useDeployment(chainId);

  const dai = useERC20(contractAddresses.dai, chainId);
  const usdc = useERC20(contractAddresses.usdc, chainId);
  const usdt = useERC20(contractAddresses.usdt, chainId);
  const threeX = useSetToken(contractAddresses.threeX, chainId);
  const threeXBatch = useThreeXBatch(contractAddresses.threeXBatch, chainId);
  const threeXZapper = useThreeXZapper(contractAddresses.threeXZapper, chainId);
  const setBasicIssuanceModule = useBasicIssuanceModule(contractAddresses.setBasicIssuanceModule, chainId);
  const threePool = useThreePool(contractAddresses.threePool, chainId);

  const shouldFetch = !!(
    [ChainId.Ethereum, ChainId.Hardhat, ChainId.Localhost].includes(chainId) &&
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
    isButterSupportedOnCurrentNetwork(chainId)
  );

  return useSWR(shouldFetch ? [`threeX-batch-data`, chainId, account] : null, async () => {
    return getData(account, dai, usdc, usdt, threePool, threeX, setBasicIssuanceModule, threeXBatch, threeXZapper);
  });
}
