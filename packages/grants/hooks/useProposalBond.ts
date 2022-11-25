import { isAddress } from "@ethersproject/address";
import { BeneficiaryGovernance, ERC20 } from "@popcorn/hardhat/typechain";
import { BigNumber, constants } from "ethers";
import useSWR, { SWRResponse } from "swr";

export default function useProposalBond(beneficiaryGovernance: BeneficiaryGovernance): SWRResponse<BigNumber, null> {
  return useSWR(
    [beneficiaryGovernance],
    async (beneficiaryGovernance: BeneficiaryGovernance) => {
      if (!beneficiaryGovernance) {
        return null;
      }
      console.log(beneficiaryGovernance);
      const first = await beneficiaryGovernance.DefaultConfigurations();
      return first.proposalBond;
    },
    {
      refreshInterval: 3 * 100,
      dedupingInterval: 5 * 1000,
    },
  );
}
