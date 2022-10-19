import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { BatchMetadata } from "@popcorn/utils/types";
import useERC20 from "hooks/tokens/useERC20";
import { useDeployment } from "hooks/useDeployment";
import useThreePool from "hooks/useThreePool";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";
import { getDataWhale } from "../../helper/threeXDataUtils";
import useBasicIssuanceModule from "../set/useBasicIssuanceModule";
import useSetToken from "../set/useSetToken";
import useThreeXBatch from "../set/useThreeXBatch";
import useThreeXWhale from "./useThreeXWhale";

export default function useThreeXWhaleData(chainId): SWRResponse<BatchMetadata, Error> {
  const { account } = useWeb3();
  const contractAddresses = useDeployment(chainId);

  const dai = useERC20(contractAddresses.dai, chainId);
  const usdc = useERC20(contractAddresses.usdc, chainId);
  const usdt = useERC20(contractAddresses.usdt, chainId);
  const threeX = useSetToken(contractAddresses.threeX, chainId);
  const threeXWhale = useThreeXWhale(contractAddresses.threeXWhale, chainId);
  const threeXBatch = useThreeXBatch(contractAddresses.threeXBatch, chainId);
  const setBasicIssuanceModule = useBasicIssuanceModule(contractAddresses.setBasicIssuanceModule, chainId);
  const threePool = useThreePool(contractAddresses.threePool, chainId);

  const shouldFetch = !!(
    [ChainId.Ethereum, ChainId.Hardhat, ChainId.Localhost].includes(chainId) &&
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
