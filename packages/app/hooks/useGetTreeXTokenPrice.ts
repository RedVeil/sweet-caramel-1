import { parseEther } from "@ethersproject/units";
import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { BasicIssuanceModule, ThreeXBatchProcessing } from "@popcorn/hardhat/typechain";
import { Address } from "@popcorn/utils/types";
import { BigNumber } from "ethers";
import useBasicIssuanceModule from "hooks/set/useBasicIssuanceModule";
import useWeb3 from "hooks/useWeb3";
import useSWR from "swr";
import useThreeXBatch from "./set/useThreeXBatch";

async function getTokenPrice(
  basicIssuanceModule: BasicIssuanceModule,
  threeXBatchProcessing: ThreeXBatchProcessing,
  threeXAdress: Address,
): Promise<BigNumber> {
  return threeXBatchProcessing.valueOfComponents(
    ...(await basicIssuanceModule.getRequiredComponentUnitsForIssue(threeXAdress, parseEther("1"))),
  );
}

export default function useGetThreeXTokenPrice() {
  const { chainId } = useWeb3();
  const threeXBatch = useThreeXBatch();
  const basicIssuanceModule = useBasicIssuanceModule();
  const { threeX } = getChainRelevantContracts(chainId);
  const shouldFetch = threeXBatch && basicIssuanceModule && threeX && chainId;
  return useSWR(shouldFetch ? ["getTokenPrice", threeXBatch, basicIssuanceModule, threeX] : null, async () =>
    getTokenPrice(basicIssuanceModule, threeXBatch, threeX),
  );
}
